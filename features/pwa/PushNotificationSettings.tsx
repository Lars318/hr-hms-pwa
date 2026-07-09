"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Bell, BellOff, Loader2, Send } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type SupportState = "checking" | "unsupported" | "ready";
type PermState = "default" | "granted" | "denied";

export function PushNotificationSettings() {
  const [support, setSupport] = useState<SupportState>("checking");
  const [permission, setPermission] = useState<PermState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const { data: publicKeyData } = trpc.push.getPublicKey.useQuery();
  const { data: statusData, refetch: refetchStatus } = trpc.push.status.useQuery();

  const subscribeMut = trpc.push.subscribe.useMutation();
  const unsubscribeMut = trpc.push.unsubscribe.useMutation();
  const testMut = trpc.push.test.useMutation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupport("unsupported");
      return;
    }
    setSupport("ready");
    setPermission(Notification.permission as PermState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    );
  }, []);

  useEffect(() => {
    if (statusData !== undefined) {
      setSubscribed(statusData.activeSubscriptions > 0);
    }
  }, [statusData]);

  async function handleEnable() {
    if (!publicKeyData?.publicKey) return;
    setWorking(true);
    setMessage(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermState);
      if (perm !== "granted") {
        setMessage({ text: "Push-tillatelse ble avvist av nettleseren.", ok: false });
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKeyData.publicKey) as unknown as BufferSource,
      });

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Ugyldig subscription-objekt fra nettleseren.");
      }

      await subscribeMut.mutateAsync({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      });

      setSubscribed(true);
      setMessage({ text: "Push-varsler er aktivert for denne enheten.", ok: true });
      void refetchStatus();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Kunne ikke aktivere push-varsler.",
        ok: false,
      });
    } finally {
      setWorking(false);
    }
  }

  async function handleDisable() {
    setWorking(true);
    setMessage(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await unsubscribeMut.mutateAsync({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }

      setSubscribed(false);
      setMessage({ text: "Push-varsler er deaktivert for denne enheten.", ok: true });
      void refetchStatus();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Kunne ikke deaktivere push-varsler.",
        ok: false,
      });
    } finally {
      setWorking(false);
    }
  }

  async function handleTest() {
    setWorking(true);
    setMessage(null);
    try {
      await testMut.mutateAsync();
      setMessage({ text: "Testvarsel sendt — sjekk varsler på denne enheten.", ok: true });
    } catch {
      setMessage({ text: "Kunne ikke sende testvarsel.", ok: false });
    } finally {
      setWorking(false);
    }
  }

  if (support === "checking") return null;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Push-varsler</h3>
      </div>

      {support === "unsupported" && (
        <p className="text-xs text-muted-foreground">
          Nettleseren din støtter ikke push-varsler.
        </p>
      )}

      {support === "ready" && (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-muted-foreground">Tillatelse</span>
            <span className={
              permission === "granted" ? "text-green-700 font-medium" :
              permission === "denied" ? "text-red-700 font-medium" :
              "text-muted-foreground"
            }>
              {permission === "granted" ? "Gitt" : permission === "denied" ? "Avslått" : "Ikke spurt ennå"}
            </span>

            <span className="text-muted-foreground">Status</span>
            <span className={subscribed ? "text-green-700 font-medium" : "text-muted-foreground"}>
              {subscribed ? "Aktiv på denne enheten" : "Ikke aktivert"}
            </span>
          </div>

          {permission === "denied" && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
              Push-tillatelse er avslått i nettleseren. Gå til nettleserinnstillinger og tillat varsler for denne siden.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!subscribed ? (
              <button
                onClick={handleEnable}
                disabled={working || permission === "denied"}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {working ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
                Aktiver push
              </button>
            ) : (
              <>
                <button
                  onClick={handleDisable}
                  disabled={working}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-50 hover:bg-accent transition-colors"
                >
                  {working ? <Loader2 className="h-3 w-3 animate-spin" /> : <BellOff className="h-3 w-3" />}
                  Deaktiver push
                </button>

                <button
                  onClick={handleTest}
                  disabled={working}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 hover:bg-accent transition-colors"
                >
                  {working ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Send testvarsel
                </button>
              </>
            )}
          </div>

          {message && (
            <p className={`text-xs rounded p-2 ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {message.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
