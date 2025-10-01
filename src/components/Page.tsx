/* @ts-nocheck */
import React from "react";
import "./page.css";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode; // knoppen rechtsboven
  children: React.ReactNode;
};

export default function Page({ title, subtitle, actions, children }: Props) {
  return (
    <div className="page">
      {(title || actions) && (
        <header className="page__header">
          <div className="page__titles">
            {title && <h2 className="page__title">{title}</h2>}
            {subtitle && <p className="page__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page__actions">{actions}</div>}
        </header>
      )}
      <main className="page__body">{children}</main>
    </div>
  );
}

  