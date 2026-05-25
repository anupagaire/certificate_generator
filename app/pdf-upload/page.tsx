"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

// ── DSigner WebSocket helper ──────────────────────────────────────────────────
function signPdfWithDsigner(base64Pdf: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://127.0.0.1:8080");
    ws.binaryType = "arraybuffer";
    let connected = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("DSigner timed out. Is the DSigner app running?"));
    }, 30000);

    ws.onopen = () => {
      console.log("DSigner WS opened, waiting for connection confirmation...");
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        const text = event.data.trim();
        console.log("DSigner message:", text.substring(0, 300));

        let parsed: { status?: string; message?: string } = {};
        try {
          parsed = JSON.parse(text);
        } catch {}

        // First message: connection confirmed → send signPdf request
        if (!connected && parsed.status === "connected") {
          connected = true;
          console.log("DSigner ready, sending signPdf request...");

          const message =
            "action=signPdf\n" +
            `input={0,"${base64Pdf}"}\n` +
            "signPage=all\n" +
            "coordinates=400,100,600,200\n" +
            "location=Kathmandu\n" +
            "textStamp=0\n" +
            `output={"/Users/anupagaire/Downloads/signed_output.pdf"}`;

          ws.send(message);
          return;
        }

        // Error
        if (parsed.status === "error" || parsed.status === "failed") {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(`DSigner error: ${parsed.message || text}`));
          return;
        }

        // Success — base64 signed PDF in parsed.message
        if (parsed.status === "success" && parsed.message) {
          try {
            const binary = atob(parsed.message);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            clearTimeout(timeout);
            ws.close();
            resolve(bytes);
          } catch (e) {
            clearTimeout(timeout);
            ws.close();
            reject(new Error("Failed to decode signed PDF: " + String(e)));
          }
          return;
        }
      } else if (event.data instanceof ArrayBuffer) {
        clearTimeout(timeout);
        ws.close();
        resolve(new Uint8Array(event.data));
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Cannot connect to DSigner. Make sure the DSigner app is running."));
    };

    ws.onclose = (event) => {
      console.log("DSigner WS closed:", event.code, event.reason);
    };
  });
}

export default function UploadSignPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [signProvider, setSignProvider] = useState<"rcvault" | "dsigner" | null>(null);

  // ── RC Vault flow ─────────────────────────────────────────────────────────
  const handleRcVaultSign = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    toast.loading("Signing PDF via RC Vault...");

    try {
      const formData = new FormData();
      formData.append("pdf", uploadedFile);

      const res = await fetch("/api/sign-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Signing failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SIGNED_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("PDF signed successfully via RC Vault!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Something went wrong");
      console.error(err);
    }
  };

  // ── DSigner flow ──────────────────────────────────────────────────────────
  const handleDsignerSign = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    toast.loading("Reading PDF...");

    try {
      // Convert uploaded File → base64
      const base64Pdf = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data:application/pdf;base64,
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(uploadedFile);
      });

      toast.dismiss();
      toast.loading("Sending to DSigner for digital signature...");

      // Send to DSigner via WebSocket
      const signedBytes = await signPdfWithDsigner(base64Pdf);

      // Download signed PDF
const signedBlob = new Blob([new Uint8Array(signedBytes)], {
  type: "application/pdf",
});      const url = window.URL.createObjectURL(signedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DSIGNED_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("PDF signed successfully via DSigner!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Something went wrong");
      console.error(err);
    }
  };

  const handleSign = () => {
    if (signProvider === "dsigner") {
      handleDsignerSign();
    } else {
      handleRcVaultSign();
    }
  };

  // ── Provider selection screen ─────────────────────────────────────────────
  if (!signProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Choose Signing Provider
            </h2>
            <p className="text-gray-500 mt-2 mb-4">
              Select the service you want to use to sign the PDF.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={() => setSignProvider("rcvault")}
              className="group border rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-gray-700 group-hover:text-blue-600">
                RC Vault
              </p>
              <p className="text-sm text-gray-500">Sign using RC Vault</p>
            </button>

            <button
              onClick={() => setSignProvider("dsigner")}
              className="group border rounded-xl p-6 hover:border-green-500 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-gray-700 group-hover:text-green-600">
                DSigner
              </p>
              <p className="text-sm text-gray-500">Sign using DSigner</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main upload screen ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Toaster position="top-center" />

      <div className="bg-white p-8 rounded-xl shadow-xl w-[400px] text-center space-y-6">
        {/* Active provider + switch */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Signing via:{" "}
            <span
              className={`font-semibold ${
                signProvider === "dsigner" ? "text-green-600" : "text-blue-600"
              }`}
            >
              {signProvider === "dsigner" ? "DSigner" : "RC Vault"}
            </span>
          </span>
          <button
            onClick={() => setSignProvider(null)}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Switch
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Upload & Sign PDF</h1>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setUploadedFile(e.target.files[0]);
            }
          }}
          className="text-gray-800 w-full"
        />

        {uploadedFile && (
          <p className="text-sm text-gray-500 truncate">
            Selected: {uploadedFile.name}
          </p>
        )}

        <button
          onClick={handleSign}
          className={`w-full py-3 rounded-lg text-white font-medium transition ${
            signProvider === "dsigner"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Sign with {signProvider === "dsigner" ? "DSigner" : "RC Vault"}
        </button>
      </div>
    </div>
  );
}