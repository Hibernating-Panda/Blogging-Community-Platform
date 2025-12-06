"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Listen to Firestore user document
      const userRef = doc(db, "users", firebaseUser.uid);

      onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUser(snap.data());
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    });

    return () => unsub();
  }, []);

  return { user, loading };
}
