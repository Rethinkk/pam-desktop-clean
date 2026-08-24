import React from "react";
import { Link } from "react-router-dom";

const deepNavy = "#123052";
const olive = "#687348";
const warmIvory = "#F8F5EE";
const softWhite = "#FCFBF8";
const slateBlue = "#60718A";
const warmGrey = "#DEDCD5";

export type PublicFooterItem = {
  label: string;
  slug: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

export const publicFooterGroups: Array<{
  heading: string;
  items: PublicFooterItem[];
}> = [
  {
    heading: "PAM",
    items: [
      {
        label: "Over PAM",
        slug: "over-pam",
        title: "Over PAM",
        intro: "PAM is gemaakt om mensen overzicht te geven over hun assets, documenten, betrokken personen en belangrijke wensen.",
        sections: [
          {
            heading: "Waarom PAM bestaat",
            body: "Het leven verandert. Juist dan helpt het als waardevolle informatie niet verspreid staat, maar rustig en begrijpelijk bij elkaar komt.",
          },
          {
            heading: "Voor wie PAM is",
            body: "PAM is er voor mensen die hun eigen overzicht willen bewaren en voor de professionals die hen zorgvuldig begeleiden.",
          },
        ],
      },
      {
        label: "Contact",
        slug: "contact",
        title: "Contact",
        intro: "Neem contact op met PAM voor vragen, feedback of samenwerking.",
        sections: [
          {
            heading: "Gebruikers en testers",
            body: "Feedback over gebruiksgemak, taal en vertrouwen helpt PAM beter worden voordat gevoelige cloudfunctionaliteit wordt uitgerold.",
          },
          {
            heading: "Professionals",
            body: "Notarissen, fiscalisten, accountants en adviseurs kunnen contact opnemen over toegang, toestemming en professionele workflows.",
          },
        ],
      },
      {
        label: "Corporate information",
        slug: "corporate-information",
        title: "Corporate information",
        intro: "Hier komt de formele bedrijfsinformatie van PAM te staan.",
        sections: [
          {
            heading: "Onderneming",
            body: "Deze pagina wordt gebruikt voor bedrijfsnaam, vestigingsgegevens, KvK-gegevens en andere formele informatie.",
          },
          {
            heading: "Transparantie",
            body: "PAM wil dat gebruikers eenvoudig kunnen zien wie achter de applicatie staat en hoe zij contact kunnen opnemen.",
          },
        ],
      },
    ],
  },
  {
    heading: "Service",
    items: [
      {
        label: "Pricing",
        slug: "pricing",
        title: "Pricing",
        intro: "PAM werkt toe naar een helder prijsmodel dat past bij persoonlijk gebruik en professionele begeleiding.",
        sections: [
          {
            heading: "Persoonlijk gebruik",
            body: "De instap moet laag genoeg blijven om PAM toegankelijk te maken, zonder concessies te doen aan veiligheid en continuïteit.",
          },
          {
            heading: "Professioneel gebruik",
            body: "Voor professionals kan later een apart model ontstaan voor begeleiding, dossiervoorbereiding en gecontroleerde toegang.",
          },
        ],
      },
      {
        label: "Voor professionals",
        slug: "voor-professionals",
        title: "Voor professionals",
        intro: "PAM helpt professionals alleen meekijken wanneer de gebruiker daar bewust toestemming voor geeft.",
        sections: [
          {
            heading: "Formele toestemming",
            body: "Toegang hoort doelgericht, beperkt en herroepbaar te zijn. PAM legt daarom vast wie toegang krijgt, waarvoor en tot wanneer.",
          },
          {
            heading: "Rustiger dossierwerk",
            body: "Professionals kunnen beter helpen wanneer assets, documenten en betrokken personen logisch bij elkaar staan.",
          },
        ],
      },
      {
        label: "FAQ",
        slug: "faq",
        title: "FAQ",
        intro: "Veelgestelde vragen over PAM, accounts, data, toegang en gebruik.",
        sections: [
          {
            heading: "Moet alles meteen compleet zijn?",
            body: "Nee. PAM is bedoeld om stap voor stap te groeien. Eén asset vastleggen is al een goed begin.",
          },
          {
            heading: "Kan ik later aanpassen?",
            body: "Ja. Zolang informatie niet formeel is vastgelegd, kun je deze aanpassen en aanvullen.",
          },
        ],
      },
    ],
  },
  {
    heading: "Vertrouwen",
    items: [
      {
        label: "Security",
        slug: "security",
        title: "Security",
        intro: "PAM wordt ontworpen vanuit het principe dat gevoelige informatie bescherming, controle en duidelijke grenzen nodig heeft.",
        sections: [
          {
            heading: "Local-first",
            body: "De applicatie is ontworpen om eerst lokaal te kunnen werken. Cloudopslag wordt alleen zinvol wanneer encryptie, login en toestemming goed zijn ingericht.",
          },
          {
            heading: "Encrypted data",
            body: "De cloudlaag is bedoeld voor versleutelde records. De backend hoort geen leesbare inhoud van assets, documenten of persoonlijke informatie te ontvangen.",
          },
        ],
      },
      {
        label: "Hoe PAM met data omgaat",
        slug: "hoe-pam-met-data-omgaat",
        title: "Hoe PAM met data omgaat",
        intro: "In gewone taal: PAM wil dat jij begrijpt waar je informatie staat, wie erbij kan en wat toestemming betekent.",
        sections: [
          {
            heading: "Wie kan mijn gegevens zien?",
            body: "Jij bepaalt wie toegang krijgt. Professionals krijgen alleen toegang wanneer jij daar expliciet toestemming voor geeft.",
          },
          {
            heading: "Kan PAM mijn gegevens zien?",
            body: "Het doel is dat PAM geen leesbare inhoud nodig heeft voor cloudopslag. Gegevens horen versleuteld te worden verwerkt en opgeslagen.",
          },
          {
            heading: "Wat gebeurt er bij stoppen?",
            body: "Een volwassen PAM-account moet duidelijke export-, verwijder- en beëindigingsmogelijkheden krijgen, zodat je niet opgesloten raakt.",
          },
        ],
      },
      {
        label: "Toestemming & toegang",
        slug: "toestemming-en-toegang",
        title: "Toestemming & toegang",
        intro: "Toegang tot PAM-informatie moet bewust, doelgericht en herroepbaar zijn.",
        sections: [
          {
            heading: "Waarom toestemming belangrijk is",
            body: "Een notaris, fiscalist, accountant of adviseur moet kunnen aantonen dat hij of zij gegevens mag bekijken.",
          },
          {
            heading: "Onder jouw regie",
            body: "De gebruiker blijft eigenaar van de toestemming en moet die later kunnen intrekken of beperken.",
          },
        ],
      },
    ],
  },
  {
    heading: "Legal",
    items: [
      {
        label: "Privacy Statement",
        slug: "privacy-statement",
        title: "Privacy Statement",
        intro: "Deze pagina wordt het formele privacy statement van PAM.",
        sections: [
          {
            heading: "Formeel document",
            body: "De juridische privacytekst moet later worden opgesteld en gecontroleerd voor productiegebruik.",
          },
          {
            heading: "Menselijke uitleg",
            body: "Voor begrijpelijke uitleg verwijst PAM ook naar de pagina Hoe PAM met data omgaat.",
          },
        ],
      },
      {
        label: "Terms of Use",
        slug: "terms-of-use",
        title: "Terms of Use",
        intro: "Deze pagina wordt de formele gebruiksvoorwaarden van PAM.",
        sections: [
          {
            heading: "Gebruik van PAM",
            body: "Hier komen de voorwaarden voor accountgebruik, verantwoordelijkheid, beschikbaarheid en toegestane toepassing.",
          },
          {
            heading: "Nog te finaliseren",
            body: "Voor productie moet deze tekst juridisch worden uitgewerkt en goedgekeurd.",
          },
        ],
      },
      {
        label: "Cookie Statement",
        slug: "cookie-statement",
        title: "Cookie Statement",
        intro: "Deze pagina wordt het cookie statement van PAM.",
        sections: [
          {
            heading: "Functioneel gebruik",
            body: "PAM gebruikt in de POC lokale opslag om sessie en gegevens in de browser te bewaren.",
          },
          {
            heading: "Toekomstige tracking",
            body: "Eventuele analytische of marketingcookies moeten apart worden beoordeeld en duidelijk worden uitgelegd.",
          },
        ],
      },
    ],
  },
];

export const publicFooterItems = publicFooterGroups.flatMap((group) => group.items);

export function findPublicFooterItem(slug = "") {
  return publicFooterItems.find((item) => item.slug === slug);
}

export default function PublicFooter() {
  return (
    <footer
      style={{
        background: softWhite,
        border: `1px solid ${warmGrey}`,
        borderRadius: 16,
        color: deepNavy,
        margin: "22px auto 0",
        maxWidth: 1040,
        overflow: "hidden",
        width: "min(calc(100% - clamp(22px, 8vw, 92px)), 1040px)",
      }}
    >
      <style>{`
        @media (max-width: 760px) {
          .pam-public-footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .pam-public-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div
        className="pam-public-footer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {publicFooterGroups.map((group) => (
          <div key={group.heading}>
            <div
              style={{
                borderBottom: `1px solid ${warmGrey}`,
                fontWeight: 800,
                padding: "14px 24px 10px",
              }}
            >
              {group.heading}
            </div>
            {group.items.map((item) => (
              <Link
                key={item.slug}
                to={`/info/${item.slug}`}
                style={{
                  borderBottom: `1px solid ${warmGrey}`,
                  color: deepNavy,
                  display: "block",
                  padding: "13px 24px",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <p
        style={{
          color: deepNavy,
          fontSize: 16,
          lineHeight: 1.5,
          margin: 0,
          padding: "18px 24px 22px",
        }}
      >
        Elke link krijgt vervolgens een <strong>eigen rustige PAM-pagina</strong>,
        in dezelfde ivory/navy/olive huisstijl.
      </p>
    </footer>
  );
}

export function PublicPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: warmIvory,
        border: `1px solid ${warmGrey}`,
        borderRadius: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        color: deepNavy,
        margin: "0 auto",
        maxWidth: 1040,
        minHeight: "calc(100vh - 40px)",
        overflow: "hidden",
        width: "min(calc(100% - clamp(22px, 8vw, 92px)), 1040px)",
      }}
    >
      {children}
    </div>
  );
}

export const publicPageColors = {
  deepNavy,
  olive,
  pamNavy: "#173A61",
  slateBlue,
  softWhite,
  warmGrey,
  warmIvory,
};
