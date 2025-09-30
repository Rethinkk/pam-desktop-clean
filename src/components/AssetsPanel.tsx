/* @ts-nocheck */
import React from "react";
import AssetForm from "./AssetForm";

type Props = { onCreated?: () => void };

export default function AssetsPanel({ onCreated }: Props) {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Nieuw asset</h2>
      <AssetForm onCreated={onCreated} />
      <p className="text-xs text-gray-500">
        Na opslaan verschijnt het item in de tab <strong>Asset register</strong>.
      </p>
    </div>
  );
}

