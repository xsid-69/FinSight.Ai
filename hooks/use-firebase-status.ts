"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshotsInSync } from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db, firebaseConfigured } from "@/lib/firebase";

interface FirebaseStatus {
  accountLabel: string;
  syncLabel: string;
  isOnline: boolean;
}

const demoStatus: FirebaseStatus = {
  accountLabel: "Demo workspace",
  syncLabel: "Local data",
  isOnline: true,
};

export const useFirebaseStatus = (): FirebaseStatus => {
  const [status, setStatus] = useState<FirebaseStatus>(demoStatus);

  useEffect(() => {
    if (!firebaseConfigured || !auth || !db) return;

    const updateNetworkStatus = () => {
      setStatus((current) => ({
        ...current,
        isOnline: navigator.onLine,
        syncLabel: navigator.onLine ? "Syncing" : "Offline",
      }));
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setStatus((current) => ({
        ...current,
        accountLabel: user?.email ?? "Guest account",
      }));
    });
    const unsubscribeSync = onSnapshotsInSync(db, () => {
      setStatus((current) => ({
        ...current,
        isOnline: navigator.onLine,
        syncLabel: navigator.onLine ? "Live sync" : "Offline",
      }));
    });

    updateNetworkStatus();
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      unsubscribeAuth();
      unsubscribeSync();
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  return status;
};
