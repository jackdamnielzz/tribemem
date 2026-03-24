import React from 'react';

/* ─────────────────────────── helpers ─────────────────────────── */

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-4 text-xl font-semibold">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-3 text-lg font-medium">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 ml-6 list-disc space-y-1 text-muted-foreground">{children}</ul>;
}
function OL({ children }: { children: React.ReactNode }) {
  return <ol className="mb-4 ml-6 list-decimal space-y-1 text-muted-foreground">{children}</ol>;
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-background p-4 text-sm">
      <code>{children}</code>
    </pre>
  );
}
function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const colors = {
    info: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200',
    tip: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
  };
  const labels = { info: 'Info', warning: 'Let op', tip: 'Tip' };
  return (
    <div className={`mb-4 rounded-lg border p-4 ${colors[type]}`}>
      <p className="mb-1 text-sm font-semibold">{labels[type]}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────── AAN DE SLAG ──────────────────── */

function Welkom() {
  return (
    <>
      <P>
        TribeMem is een autonoom kennisplatform dat continu de communicatie- en documentatietools van
        je team monitort, automatisch organisatiekennis extraheert en deze via een uniforme
        query-interface beschikbaar stelt.
      </P>
      <H2>Wat maakt TribeMem uniek?</H2>
      <UL>
        <li><strong>Geen wiki</strong> — TribeMem blijft automatisch actueel zonder handmatig onderhoud.</li>
        <li><strong>Geen document-zoekmachine</strong> — Het synthetiseert kennis uit gedrag en patronen.</li>
        <li><strong>Temporele versioning</strong> — Elk feit heeft een tijdlijn; oude versies worden nooit verwijderd.</li>
        <li><strong>Bronverwijzingen</strong> — Elk antwoord is terug te traceren naar het oorspronkelijke bericht, ticket of document.</li>
      </UL>
      <H2>Voor wie is TribeMem?</H2>
      <UL>
        <li><strong>Teamleiders &amp; managers</strong> — Versnel onboarding en verminder herhaalde vragen.</li>
        <li><strong>Nieuwe medewerkers</strong> — Begrijp snel hoe dingen echt werken.</li>
        <li><strong>Consultants &amp; auditors</strong> — Traceer beslissingen en hun rationale.</li>
        <li><strong>Developers</strong> — Query via API of MCP voor custom tools.</li>
        <li><strong>Ops &amp; support leads</strong> — Identificeer process drift en kennislacunes.</li>
      </UL>
      <H2>Volgende stappen</H2>
      <P>
        Maak een account aan en zet je organisatie op om direct aan de slag te gaan. Koppel je eerste
        connector en stel je eerste vraag.
      </P>
    </>
  );
}

function AccountAanmaken() {
  return (
    <>
      <P>
        Het aanmaken van een TribeMem-account duurt slechts een paar minuten.
      </P>
      <H2>Stappen</H2>
      <OL>
        <li>Ga naar de registratiepagina via <strong>Sign up</strong> op de loginpagina.</li>
        <li>Vul je e-mailadres en een sterk wachtwoord in.</li>
        <li>Klik op <strong>Create account</strong>.</li>
        <li>Je ontvangt een welkomst-e-mail ter bevestiging.</li>
        <li>Na registratie word je automatisch doorgestuurd naar de onboarding.</li>
      </OL>
      <Callout type="tip">
        Gebruik je werk-e-mailadres zodat teamgenoten je makkelijk kunnen herkennen wanneer je ze uitnodigt.
      </Callout>
      <H2>Wachtwoord vergeten?</H2>
      <P>
        Klik op <strong>Forgot password</strong> op de loginpagina. Je ontvangt een e-mail met een link
        om een nieuw wachtwoord in te stellen.
      </P>
    </>
  );
}

function OrganisatieOpzetten() {
  return (
    <>
      <P>
        Na het aanmaken van je account word je gevraagd om een organisatie op te zetten. Dit is de
        werkruimte waarin alle kennis, connectors en teamleden worden beheerd.
      </P>
      <H2>Organisatie aanmaken</H2>
      <OL>
        <li>Vul een <strong>organisatienaam</strong> in (bijv. &quot;Mijn Bedrijf&quot;).</li>
        <li>De <strong>URL-slug</strong> wordt automatisch gegenereerd maar is aanpasbaar.</li>
        <li>Voeg optioneel een <strong>beschrijving</strong> toe.</li>
        <li>Klik op <strong>Create Organization</strong>.</li>
      </OL>
      <P>
        Je wordt automatisch toegewezen als <strong>Owner</strong> van de organisatie met volledige rechten.
      </P>
      <Callout type="info">
        Je kunt de organisatienaam en slug later wijzigen via Settings &gt; General.
      </Callout>
    </>
  );
}

function EersteConnector() {
  return (
    <>
      <P>
        Connectors zijn de bruggen tussen TribeMem en je bestaande tools. Door een connector te
        koppelen geef je TribeMem toegang om kennis te extraheren uit je communicatie en documentatie.
      </P>
      <H2>Een connector koppelen</H2>
      <OL>
        <li>Navigeer naar <strong>Connectors</strong> in het zijmenu.</li>
        <li>Kies de tool die je wilt koppelen (bijv. Slack, Notion, GitHub).</li>
        <li>Klik op <strong>Connect</strong>.</li>
        <li>Je wordt doorgestuurd naar de OAuth-autorisatiepagina van de betreffende tool.</li>
        <li>Geef TribeMem de gevraagde permissies.</li>
        <li>Na autorisatie word je teruggestuurd naar TribeMem.</li>
      </OL>
      <Callout type="tip">
        Begin met de tool waar je team het meest actief communiceert (meestal Slack of Discord) voor de beste resultaten.
      </Callout>
      <H2>Wat gebeurt er na het koppelen?</H2>
      <P>
        TribeMem start automatisch met het crawlen van de gekoppelde bron. De crawler haalt berichten,
        documenten en tickets op en de extractie-engine verwerkt deze tot gestructureerde kenniseenheden.
      </P>
    </>
  );
}

function EersteVraag() {
  return (
    <>
      <P>
        Zodra je eerste connector gekoppeld is en de crawler data heeft verwerkt, kun je vragen stellen
        aan je organisatiekennis.
      </P>
      <H2>Een vraag stellen</H2>
      <OL>
        <li>Klik op <strong>Ask</strong> in het zijmenu.</li>
        <li>Typ je vraag in natuurlijke taal, bijvoorbeeld: &quot;Hoe werkt ons deployment-proces?&quot;</li>
        <li>TribeMem doorzoekt de kennisbank en geeft een samengesteld antwoord met bronverwijzingen.</li>
      </OL>
      <H2>Tips voor effectieve vragen</H2>
      <UL>
        <li>Wees specifiek: &quot;Wie is verantwoordelijk voor het API-design?&quot; werkt beter dan &quot;Wie doet wat?&quot;</li>
        <li>Vraag naar processen: &quot;Wat zijn de stappen voor een code review?&quot;</li>
        <li>Vraag naar beslissingen: &quot;Waarom zijn we overgestapt naar PostgreSQL?&quot;</li>
        <li>Vraag naar normen: &quot;Wat zijn onze coding standards voor TypeScript?&quot;</li>
      </UL>
      <Callout type="info">
        Elk antwoord bevat een confidence score en bronverwijzingen zodat je kunt verifi&euml;ren waar de informatie vandaan komt.
      </Callout>
    </>
  );
}

/* ──────────────────── KERNCONCEPTEN ──────────────────── */

function Kenniseenheden() {
  return (
    <>
      <P>
        Kenniseenheden zijn de bouwstenen van TribeMem. Ze worden automatisch geëxtraheerd uit je
        gekoppelde bronnen en vertegenwoordigen discrete stukjes organisatiekennis.
      </P>
      <H2>Vijf typen kenniseenheden</H2>
      <Table
        headers={['Type', 'Beschrijving', 'Voorbeeld']}
        rows={[
          ['Feiten', 'Geverifieerde uitspraken over hoe dingen zijn', '"Onze betalingsverwerking duurt 2-3 dagen"'],
          ['Processen', 'Stapsgewijze workflows', '"Hoe een nieuwe developer te onboarden"'],
          ['Beslissingen', 'Belangrijke keuzes die zijn gemaakt', '"We kozen React boven Vue in 2022"'],
          ['Normen', 'Teamstandaarden en afspraken', '"We vereisen code reviews voor elke merge"'],
          ['Definities', 'Domeinspecifieke termen', '"Onze definitie van done"'],
        ]}
      />
      <H2>Kenmerken van een kenniseenheid</H2>
      <UL>
        <li><strong>Titel</strong> — Korte samenvatting van de kennis.</li>
        <li><strong>Beschrijving</strong> — Gedetailleerde uitleg.</li>
        <li><strong>Type</strong> — Een van de vijf typen hierboven.</li>
        <li><strong>Categorie</strong> — Engineering, support, HR, finance, product, operations, sales of general.</li>
        <li><strong>Status</strong> — Active, superseded, contradicted, archived of flagged.</li>
        <li><strong>Confidence score</strong> — Betrouwbaarheidsscore van 0 tot 1.</li>
        <li><strong>Tags</strong> — Voor filtering en organisatie.</li>
      </UL>
    </>
  );
}

function ConfidenceScores() {
  return (
    <>
      <P>
        Elke kenniseenheid in TribeMem heeft een confidence score die aangeeft hoe betrouwbaar het
        systeem de informatie acht. Scores lopen van 0 (onzeker) tot 1 (zeer betrouwbaar).
      </P>
      <H2>Hoe worden scores berekend?</H2>
      <UL>
        <li><strong>Aantal bronnen</strong> — Meer onafhankelijke bronnen die hetzelfde bevestigen verhogen de score.</li>
        <li><strong>Recentheid</strong> — Recentere informatie weegt zwaarder.</li>
        <li><strong>Consistentie</strong> — Als bronnen elkaar tegenspreken, daalt de score.</li>
        <li><strong>Brontype</strong> — Officiële documentatie weegt zwaarder dan chatberichten.</li>
      </UL>
      <H2>Score-bereiken</H2>
      <Table
        headers={['Score', 'Betekenis', 'Actie']}
        rows={[
          ['0.8 - 1.0', 'Hoge betrouwbaarheid', 'Veilig om te gebruiken'],
          ['0.5 - 0.8', 'Redelijke betrouwbaarheid', 'Controleer de bronnen'],
          ['0.0 - 0.5', 'Lage betrouwbaarheid', 'Verifieer handmatig'],
        ]}
      />
      <Callout type="info">
        Je kunt in de organisatie-instellingen een drempelwaarde instellen. Kenniseenheden onder deze drempel worden automatisch geflagd als &quot;stale&quot;.
      </Callout>
    </>
  );
}

function TemporeleVersioning() {
  return (
    <>
      <P>
        Een van de krachtigste features van TribeMem is temporele versioning. In tegenstelling tot een
        traditionele wiki, waar informatie simpelweg wordt overschreven, houdt TribeMem een complete
        tijdlijn bij van hoe kennis evolueert.
      </P>
      <H2>Hoe werkt het?</H2>
      <UL>
        <li><strong>valid_from / valid_until</strong> — Elk feit heeft een geldigheidsperiode.</li>
        <li><strong>Superseded</strong> — Wanneer een feit wordt vervangen door nieuwe informatie, wordt het oude feit gemarkeerd als &quot;superseded&quot; met een link naar de opvolger.</li>
        <li><strong>Contradicted</strong> — Als twee bronnen tegenstrijdige informatie geven, worden beide gemarkeerd.</li>
        <li><strong>Confirmed</strong> — Bij herbevestiging wordt de &quot;last_confirmed_at&quot; datum bijgewerkt.</li>
      </UL>
      <H2>Versiegeschiedenis</H2>
      <P>
        Elke kenniseenheid heeft een volledige versiegeschiedenis met wijzigingstypen: created, updated,
        superseded, contradicted, confirmed en archived. Zo kun je altijd zien wanneer en waarom
        informatie is gewijzigd.
      </P>
      <H2>Temporele context</H2>
      <Table
        headers={['Context', 'Betekenis']}
        rows={[
          ['current', 'Momenteel geldig en actueel'],
          ['historical', 'Was geldig maar is inmiddels vervangen'],
          ['planned', 'Gepland maar nog niet actief'],
        ]}
      />
    </>
  );
}

function Bronverwijzingen() {
  return (
    <>
      <P>
        Elke kenniseenheid en elk antwoord in TribeMem is traceerbaar naar de oorspronkelijke bron.
        Dit maakt het mogelijk om antwoorden te verifi&euml;ren en de context te begrijpen.
      </P>
      <H2>Hoe werken bronverwijzingen?</H2>
      <UL>
        <li>Wanneer de crawler data ophaalt, wordt elk bericht, ticket of document opgeslagen als een <strong>raw event</strong>.</li>
        <li>Bij extractie worden kenniseenheden gekoppeld aan de bronnen waaruit ze zijn afgeleid.</li>
        <li>Wanneer je een vraag stelt, toont het antwoord de bronnen die zijn gebruikt.</li>
      </UL>
      <H2>Brontypen</H2>
      <Table
        headers={['Bron', 'Voorbeeld']}
        rows={[
          ['Slack-bericht', '#engineering kanaal, door @jan, 15 maart 2024'],
          ['Notion-pagina', 'Deployment Guide, laatst bewerkt 10 jan 2024'],
          ['Jira-ticket', 'PROJ-1234: API redesign'],
          ['GitHub PR', 'PR #456: Migrate to PostgreSQL'],
          ['Google Drive', 'Architectuur Document v2.pdf'],
        ]}
      />
      <Callout type="tip">
        Klik op een bronverwijzing om direct naar het oorspronkelijke document of bericht te navigeren (indien de connector dit ondersteunt).
      </Callout>
    </>
  );
}

/* ──────────────────── FUNCTIES ──────────────────── */

function Dashboard() {
  return (
    <>
      <P>
        Het dashboard geeft je een overzicht van de belangrijkste statistieken van je organisatie.
      </P>
      <H2>Statistieken</H2>
      <Table
        headers={['Kaart', 'Beschrijving']}
        rows={[
          ['Total Knowledge', 'Het totaal aantal kenniseenheden in je organisatie'],
          ['Active Connectors', 'Aantal actief gekoppelde integraties'],
          ['Queries', 'Totaal aantal vragen dat is gesteld'],
          ['Pending Alerts', 'Aantal onopgeloste meldingen'],
        ]}
      />
      <H2>Knowledge Growth</H2>
      <P>
        De Knowledge Growth-grafiek toont hoe je kennisbank groeit over tijd. Dit helpt je om te
        begrijpen welke bronnen het meest bijdragen.
      </P>
      <H2>Recent Queries</H2>
      <P>
        Een overzicht van de meest recente vragen die door teamleden zijn gesteld, inclusief de
        kwaliteit van de antwoorden.
      </P>
    </>
  );
}

function AskPage() {
  return (
    <>
      <P>
        De Ask-pagina is het hart van TribeMem. Hier stel je vragen in natuurlijke taal en ontvang je
        samengestelde antwoorden gebaseerd op de kennis uit al je gekoppelde bronnen.
      </P>
      <H2>Hoe werkt het?</H2>
      <OL>
        <li>Typ je vraag in het invoerveld.</li>
        <li>TribeMem doorzoekt alle kenniseenheden met behulp van semantisch zoeken.</li>
        <li>De synthesize-engine combineert relevante kennis tot een coherent antwoord.</li>
        <li>Het antwoord bevat bronverwijzingen en een confidence score.</li>
      </OL>
      <H2>Voorbeeldvragen</H2>
      <UL>
        <li>&quot;Hoe werkt ons deployment-proces?&quot;</li>
        <li>&quot;Wie is verantwoordelijk voor het API-design?&quot;</li>
        <li>&quot;Wat zijn de stappen voor een code review?&quot;</li>
        <li>&quot;Waarom zijn we overgestapt naar PostgreSQL?&quot;</li>
        <li>&quot;Wat zijn de onboarding-stappen voor nieuwe developers?&quot;</li>
        <li>&quot;Welke coding standards hanteren we voor TypeScript?&quot;</li>
      </UL>
      <Callout type="tip">
        Stel specifieke vragen voor betere resultaten. &quot;Hoe deploy ik naar productie?&quot; geeft een preciezer antwoord dan &quot;Vertel me over deployments&quot;.
      </Callout>
      <H2>Querylimieten</H2>
      <P>
        Het aantal queries per maand is afhankelijk van je abonnement. Bekijk je huidige gebruik op
        de Billing-pagina onder Settings.
      </P>
    </>
  );
}

function KnowledgeBase() {
  return (
    <>
      <P>
        De Knowledge Base bevat alle geëxtraheerde kennis, verdeeld over vier categorie&euml;n die
        toegankelijk zijn via het zijmenu.
      </P>
      <H2>Navigatie</H2>
      <Table
        headers={['Tabblad', 'Inhoud']}
        rows={[
          ['Facts', 'Geverifieerde feiten over je organisatie'],
          ['Processes', 'Gedocumenteerde workflows en processen'],
          ['Decisions', 'Belangrijke beslissingen met rationale'],
          ['Norms', 'Teamstandaarden, afspraken en best practices'],
        ]}
      />
      <H2>Filteren en zoeken</H2>
      <UL>
        <li><strong>Categorie</strong> — Filter op engineering, support, HR, finance, etc.</li>
        <li><strong>Status</strong> — Filter op active, superseded, contradicted, archived of flagged.</li>
        <li><strong>Confidence</strong> — Filter op betrouwbaarheidsscore.</li>
        <li><strong>Tags</strong> — Filter op toegewezen tags.</li>
        <li><strong>Zoeken</strong> — Zoek op trefwoorden in titel en beschrijving.</li>
      </UL>
      <H2>Kenniseenheid bewerken</H2>
      <P>
        Klik op een kenniseenheid om de details te bekijken. Afhankelijk van je rol kun je de titel,
        beschrijving, tags en status aanpassen.
      </P>
    </>
  );
}

function ConnectorsPage() {
  return (
    <>
      <P>
        Connectors verbinden TribeMem met je bestaande tools. Via de Connectors-pagina kun je nieuwe
        integraties koppelen en bestaande beheren.
      </P>
      <H2>Beschikbare connectors</H2>
      <P>
        TribeMem ondersteunt momenteel integraties met Slack, Notion, Jira, GitHub, Linear, Discord,
        Google Drive, HubSpot en Freshdesk. Confluence, Intercom en Stripe komen binnenkort.
      </P>
      <H2>Een connector koppelen</H2>
      <OL>
        <li>Ga naar <strong>Connectors</strong> in het zijmenu.</li>
        <li>Zoek de gewenste tool.</li>
        <li>Klik op <strong>Connect</strong>.</li>
        <li>Doorloop het OAuth-autorisatieproces.</li>
        <li>De connector verschijnt als &quot;Connected&quot; na succesvolle koppeling.</li>
      </OL>
      <H2>Een connector ontkoppelen</H2>
      <P>
        Klik op <strong>Revoke</strong> bij een gekoppelde connector om de verbinding te verbreken. Bestaande
        kennis die via deze connector is geëxtraheerd blijft behouden.
      </P>
      <Callout type="warning">
        Het ontkoppelen van een connector stopt het crawlen van nieuwe data, maar verwijdert geen bestaande kennis.
      </Callout>
    </>
  );
}

function CrawlerPage() {
  return (
    <>
      <P>
        De Crawler is het onderdeel dat periodiek je gekoppelde bronnen doorzoekt en nieuwe data ophaalt.
      </P>
      <H2>Automatisch crawlen</H2>
      <P>
        Wanneer auto-crawl is ingeschakeld (standaard), haalt TribeMem automatisch op regelmatige
        tijden nieuwe data op uit je connectors. Dit kun je configureren in Settings &gt; General.
      </P>
      <H2>Handmatig crawlen</H2>
      <OL>
        <li>Ga naar de <strong>Crawler</strong>-pagina.</li>
        <li>Klik op <strong>Start Crawl</strong> om handmatig een crawl-run te starten.</li>
        <li>De voortgang wordt realtime getoond.</li>
      </OL>
      <H2>Crawl-runs bekijken</H2>
      <P>
        Op de Crawler-pagina zie je een overzicht van alle eerdere crawl-runs, inclusief status,
        starttijd, duur en het aantal verwerkte events.
      </P>
      <H2>Extractie</H2>
      <P>
        Na het crawlen worden de opgehaalde events automatisch verwerkt door de extractie-engine.
        Deze gebruikt AI om gestructureerde kenniseenheden te extraheren uit ongestructureerde data
        zoals chatberichten, tickets en documenten.
      </P>
    </>
  );
}

function MeldingenPage() {
  return (
    <>
      <P>
        Het meldingensysteem waarschuwt je voor belangrijke gebeurtenissen in je kennisbank, zoals
        tegenstrijdigheden, process drift en verouderde kennis.
      </P>
      <H2>Typen meldingen</H2>
      <Table
        headers={['Type', 'Beschrijving']}
        rows={[
          ['Contradiction', 'Twee of meer bronnen spreken elkaar tegen'],
          ['Process Drift', 'Een beschreven proces wijkt af van de daadwerkelijke praktijk'],
          ['Knowledge Gap', 'Er is een lacune in de kennis gedetecteerd'],
          ['Stale Knowledge', 'Kennis is langere tijd niet bevestigd of bijgewerkt'],
          ['Connector Error', 'Er is een probleem met een gekoppelde connector'],
          ['Usage Limit', 'Je nadert of overschrijdt een gebruikslimiet'],
        ]}
      />
      <H2>Ernst-niveaus</H2>
      <Table
        headers={['Niveau', 'Betekenis']}
        rows={[
          ['Critical', 'Onmiddellijke actie vereist'],
          ['High', 'Zo snel mogelijk oplossen'],
          ['Medium', 'Aandacht nodig op korte termijn'],
          ['Low', 'Op termijn bekijken'],
          ['Info', 'Ter informatie'],
        ]}
      />
      <H2>Meldingen beheren</H2>
      <UL>
        <li>Klik op het bel-icoon rechtsboven om recente meldingen te bekijken.</li>
        <li>Klik op een melding om deze als gelezen te markeren.</li>
        <li>Ga naar de Alerts-pagina voor een volledig overzicht.</li>
        <li>Markeer meldingen als opgelost wanneer je actie hebt ondernomen.</li>
      </UL>
    </>
  );
}

function TeamBeheer() {
  return (
    <>
      <P>
        Via de Team-pagina beheer je de leden van je organisatie. Je kunt nieuwe leden uitnodigen,
        rollen toewijzen en leden verwijderen.
      </P>
      <H2>Teamleden bekijken</H2>
      <P>
        De Team-pagina toont een overzicht van alle leden met hun naam, e-mailadres, rol en
        toevoegdatum.
      </P>
      <H2>Een lid uitnodigen</H2>
      <OL>
        <li>Klik op <strong>Invite Member</strong>.</li>
        <li>Vul het e-mailadres in van de persoon die je wilt uitnodigen.</li>
        <li>Selecteer de gewenste rol (Member of Admin).</li>
        <li>Klik op <strong>Send Invite</strong>.</li>
      </OL>
      <H2>Rollen wijzigen</H2>
      <P>
        Als Owner of Admin kun je de rol van andere leden wijzigen via het dropdown-menu naast hun
        naam. Zie &quot;Rollen &amp; permissies&quot; voor een uitleg van elke rol.
      </P>
      <H2>Een lid verwijderen</H2>
      <P>
        Klik op <strong>Remove</strong> naast het lid dat je wilt verwijderen. Dit kan niet ongedaan worden gemaakt.
      </P>
      <Callout type="warning">
        Het verwijderen van een lid maakt hun account niet ongedaan. Ze verliezen alleen toegang tot de organisatie.
      </Callout>
    </>
  );
}

/* ──────────────────── INTEGRATIES ──────────────────── */

function IntegrationPage({
  name,
  description,
  whatIsCrawled,
  permissions,
  setupSteps,
  authMethod = 'OAuth 2.0',
}: {
  name: string;
  description: string;
  whatIsCrawled: string[];
  permissions: string[];
  setupSteps: string[];
  authMethod?: string;
}) {
  return (
    <>
      <P>{description}</P>
      <H2>Wat wordt opgehaald?</H2>
      <UL>
        {whatIsCrawled.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </UL>
      <H2>Benodigde permissies</H2>
      <UL>
        {permissions.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </UL>
      <H2>Setup</H2>
      <P>
        <strong>Authenticatiemethode:</strong> {authMethod}
      </P>
      <OL>
        {setupSteps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </OL>
      <Callout type="tip">
        Na het koppelen start de crawler automatisch met het ophalen van data uit {name}.
      </Callout>
    </>
  );
}

function SlackIntegration() {
  return (
    <IntegrationPage
      name="Slack"
      description="Koppel Slack om kennis te extraheren uit de dagelijkse communicatie van je team. TribeMem leest berichten uit publieke en geautoriseerde priv&eacute;kanalen."
      whatIsCrawled={[
        'Berichten in publieke kanalen',
        'Berichten in geautoriseerde privékanalen',
        'Thread-reacties',
        'Gedeelde bestanden en links',
        'Kanaalinformatie en beschrijvingen',
      ]}
      permissions={[
        'channels:read — Lijst van kanalen bekijken',
        'channels:history — Berichten in publieke kanalen lezen',
        'groups:read — Privékanalen bekijken',
        'groups:history — Berichten in privékanalen lezen',
        'users:read — Gebruikersinformatie ophalen',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij Slack.',
        'Je wordt doorgestuurd naar Slack voor autorisatie.',
        'Selecteer de workspace die je wilt koppelen.',
        'Geef TribeMem de gevraagde permissies.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function NotionIntegration() {
  return (
    <IntegrationPage
      name="Notion"
      description="Koppel Notion om kennis te extraheren uit je wiki&apos;s, databases en documentatie."
      whatIsCrawled={[
        'Pagina-inhoud en subpagina\'s',
        'Database-entries',
        'Opmerkingen op pagina\'s',
        'Pagina-metadata (auteur, aanmaakdatum, tags)',
      ]}
      permissions={[
        'Read content — Pagina-inhoud lezen',
        'Read user info — Gebruikersinformatie ophalen',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij Notion.',
        'Je wordt doorgestuurd naar Notion voor autorisatie.',
        'Selecteer welke pagina\'s en databases je wilt delen met TribeMem.',
        'Klik op Allow access.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function JiraIntegration() {
  return (
    <IntegrationPage
      name="Jira"
      description="Koppel Jira om kennis te extraheren uit je projectmanagement, inclusief tickets, sprints en beslissingen."
      whatIsCrawled={[
        'Issues en subtasks',
        'Opmerkingen op issues',
        'Sprint-informatie',
        'Project-metadata',
        'Statuswijzigingen en workflows',
      ]}
      permissions={[
        'read:jira-work — Issues en projecten lezen',
        'read:jira-user — Gebruikersinformatie ophalen',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij Jira.',
        'Je wordt doorgestuurd naar Atlassian voor autorisatie.',
        'Selecteer de Jira-site die je wilt koppelen.',
        'Geef TribeMem leestoegang.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function GitHubIntegration() {
  return (
    <IntegrationPage
      name="GitHub"
      description="Koppel GitHub om kennis te extraheren uit pull requests, issues, discussions en code reviews."
      whatIsCrawled={[
        'Pull requests en reviews',
        'Issues en opmerkingen',
        'Discussions',
        'Repository-metadata',
        'README en documentatiebestanden',
      ]}
      permissions={[
        'repo — Toegang tot repositories',
        'read:org — Organisatie-informatie lezen',
        'read:user — Gebruikersinformatie ophalen',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij GitHub.',
        'Je wordt doorgestuurd naar GitHub voor autorisatie.',
        'Selecteer welke repositories je wilt koppelen.',
        'Geef TribeMem de gevraagde permissies.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function LinearIntegration() {
  return (
    <IntegrationPage
      name="Linear"
      description="Koppel Linear om kennis te extraheren uit je projectmanagement, inclusief issues, cycles en roadmaps."
      whatIsCrawled={[
        'Issues en sub-issues',
        'Opmerkingen',
        'Cycles en projecten',
        'Labels en statussen',
        'Team-informatie',
      ]}
      permissions={[
        'read — Leestoegang tot workspace-data',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij Linear.',
        'Je wordt doorgestuurd naar Linear voor autorisatie.',
        'Geef TribeMem leestoegang tot je workspace.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function DiscordIntegration() {
  return (
    <IntegrationPage
      name="Discord"
      description="Koppel Discord om kennis te extraheren uit serverberichten en discussies."
      whatIsCrawled={[
        'Berichten in tekstkanalen',
        'Thread-berichten',
        'Kanaalinformatie',
        'Serverinformatie',
      ]}
      permissions={[
        'Bot permissions — Berichten lezen in geautoriseerde kanalen',
        'Read Message History — Berichtgeschiedenis bekijken',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij Discord.',
        'Je wordt doorgestuurd naar Discord voor autorisatie.',
        'Selecteer de server die je wilt koppelen.',
        'Geef de TribeMem-bot de gevraagde permissies.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function GoogleDriveIntegration() {
  return (
    <IntegrationPage
      name="Google Drive"
      description="Koppel Google Drive om kennis te extraheren uit documenten, spreadsheets en presentaties."
      whatIsCrawled={[
        'Google Docs inhoud',
        'Google Sheets data',
        'Google Slides inhoud',
        'PDF-bestanden (tekst)',
        'Bestandsmetadata en mapstructuur',
      ]}
      permissions={[
        'drive.readonly — Leestoegang tot Drive-bestanden',
        'userinfo.email — E-mailadres voor identificatie',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij Google Drive.',
        'Je wordt doorgestuurd naar Google voor autorisatie.',
        'Selecteer het account dat je wilt koppelen.',
        'Geef TribeMem leestoegang tot je bestanden.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function HubSpotIntegration() {
  return (
    <IntegrationPage
      name="HubSpot"
      description="Koppel HubSpot om kennis te extraheren uit je CRM, inclusief contacten, deals en notities."
      whatIsCrawled={[
        'Contacten en bedrijven',
        'Deals en pipelines',
        'Notities en activiteiten',
        'E-mailcommunicatie (samenvatting)',
        'Ticketinformatie',
      ]}
      permissions={[
        'crm.objects.contacts.read — Contacten lezen',
        'crm.objects.deals.read — Deals lezen',
        'crm.objects.companies.read — Bedrijven lezen',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij HubSpot.',
        'Je wordt doorgestuurd naar HubSpot voor autorisatie.',
        'Selecteer het HubSpot-account dat je wilt koppelen.',
        'Geef TribeMem de gevraagde permissies.',
        'Je wordt teruggestuurd naar TribeMem.',
      ]}
    />
  );
}

function FreshdeskIntegration() {
  return (
    <IntegrationPage
      name="Freshdesk"
      description="Koppel Freshdesk om kennis te extraheren uit je klantenservicetickets en kennisbank."
      whatIsCrawled={[
        'Support-tickets en antwoorden',
        'Kennisbankartikelen',
        'Contactinformatie',
        'Ticketcategorieën en tags',
      ]}
      permissions={[
        'API key met leestoegang tot tickets en kennisbank',
      ]}
      setupSteps={[
        'Ga naar Connectors en klik op Connect bij Freshdesk.',
        'Vul je Freshdesk-domein in (bijv. mijnbedrijf.freshdesk.com).',
        'Voer je Freshdesk API-key in (te vinden in Profile Settings > API Key).',
        'Klik op Connect.',
      ]}
      authMethod="API Key"
    />
  );
}

/* ──────────────────── API ──────────────────── */

function ApiAuthenticatie() {
  return (
    <>
      <P>
        De TribeMem API gebruikt API keys voor authenticatie. Alle verzoeken moeten een geldige API key
        bevatten in de Authorization header.
      </P>
      <H2>API key aanmaken</H2>
      <OL>
        <li>Ga naar <strong>API Keys</strong> in het zijmenu (onder Settings).</li>
        <li>Klik op <strong>Create API Key</strong>.</li>
        <li>Geef de key een beschrijvende naam.</li>
        <li>Selecteer de gewenste scopes (permissies).</li>
        <li>Klik op <strong>Create</strong>.</li>
        <li>Kopieer de key onmiddellijk — deze wordt slechts &eacute;&eacute;n keer getoond.</li>
      </OL>
      <H2>Authenticatie</H2>
      <P>Voeg de API key toe aan elke request via de Authorization header:</P>
      <Code>{`curl -H "Authorization: Bearer tm_your_api_key_here" \\
  https://app.tribemem.com/api/v1/knowledge`}</Code>
      <H2>Beschikbare scopes</H2>
      <Table
        headers={['Scope', 'Beschrijving']}
        rows={[
          ['query:read', 'Kennisbank doorzoeken'],
          ['knowledge:read', 'Kenniseenheden ophalen'],
          ['knowledge:write', 'Kenniseenheden aanmaken en bewerken'],
          ['connectors:read', 'Connectors bekijken'],
          ['connectors:write', 'Connectors beheren'],
          ['members:read', 'Teamleden bekijken'],
          ['members:write', 'Teamleden beheren'],
          ['alerts:read', 'Meldingen bekijken'],
          ['alerts:write', 'Meldingen beheren'],
          ['billing:read', 'Facturatie bekijken'],
          ['billing:write', 'Facturatie beheren'],
        ]}
      />
    </>
  );
}

function KnowledgeEndpoints() {
  return (
    <>
      <H2>Query — Vraag stellen</H2>
      <Code>{`POST /api/v1/query
Content-Type: application/json

{
  "query": "Hoe werkt ons deployment-proces?"
}`}</Code>
      <P>Retourneert een samengesteld antwoord met bronverwijzingen en confidence score.</P>

      <H2>Kenniseenheden ophalen</H2>
      <Code>{`GET /api/v1/knowledge
GET /api/v1/knowledge?type=process&category=engineering&status=active
GET /api/v1/knowledge?page=1&limit=20`}</Code>
      <P>Ondersteunt filtering op type, categorie, status en paginering.</P>

      <H2>Enkele kenniseenheid ophalen</H2>
      <Code>{`GET /api/v1/knowledge/:id`}</Code>

      <H2>Kenniseenheid aanmaken</H2>
      <Code>{`POST /api/v1/knowledge
Content-Type: application/json

{
  "title": "Deployment proces",
  "content": "We deployen elke dinsdag via CI/CD...",
  "type": "process",
  "category": "engineering",
  "tags": ["deployment", "ci-cd"]
}`}</Code>

      <H2>Kenniseenheid bijwerken</H2>
      <Code>{`PATCH /api/v1/knowledge/:id
Content-Type: application/json

{
  "title": "Bijgewerkte titel",
  "content": "Bijgewerkte inhoud..."
}`}</Code>

      <H2>Kenniseenheid verwijderen</H2>
      <Code>{`DELETE /api/v1/knowledge/:id`}</Code>
      <Callout type="warning">
        Verwijderen is permanent. Overweeg om de status naar &quot;archived&quot; te wijzigen als alternatief.
      </Callout>
    </>
  );
}

function AlertsEndpoints() {
  return (
    <>
      <H2>Alle meldingen ophalen</H2>
      <Code>{`GET /api/v1/alerts`}</Code>
      <P>Retourneert alle meldingen voor je organisatie, gesorteerd op aanmaakdatum (nieuwste eerst).</P>

      <H2>Melding bijwerken</H2>
      <Code>{`PATCH /api/v1/alerts/:id
Content-Type: application/json

{
  "is_read": true,
  "is_resolved": true
}`}</Code>

      <H2>Response-voorbeeld</H2>
      <Code>{`{
  "alerts": [
    {
      "id": "uuid",
      "type": "contradiction",
      "severity": "high",
      "title": "Tegenstrijdige informatie over deployment-dag",
      "description": "Bron A zegt dinsdag, bron B zegt donderdag",
      "is_read": false,
      "is_resolved": false,
      "created_at": "2024-03-15T10:30:00Z"
    }
  ],
  "total": 1
}`}</Code>
    </>
  );
}

function ConnectorsEndpoints() {
  return (
    <>
      <H2>Alle connectors ophalen</H2>
      <Code>{`GET /api/v1/connectors`}</Code>
      <P>Retourneert alle connectors voor je organisatie met hun status.</P>

      <H2>Connector koppelen (OAuth)</H2>
      <Code>{`POST /api/v1/connectors/:type/connect`}</Code>
      <P>
        Start het OAuth-autorisatieproces. Retourneert een redirect-URL waarnaar de gebruiker gestuurd moet worden.
        Ondersteunde types: slack, notion, jira, github, linear, discord, google-drive, hubspot.
      </P>

      <H2>OAuth callback</H2>
      <Code>{`GET /api/v1/connectors/:type/callback?code=...&state=...`}</Code>
      <P>
        Dit endpoint wordt automatisch aangeroepen door de OAuth-provider na autorisatie.
        Het slaat de credentials veilig op (AES-256-GCM versleuteld).
      </P>

      <H2>Response-voorbeeld</H2>
      <Code>{`{
  "connectors": [
    {
      "id": "uuid",
      "type": "slack",
      "status": "connected",
      "connected_at": "2024-03-01T09:00:00Z",
      "last_crawled_at": "2024-03-15T14:30:00Z"
    }
  ]
}`}</Code>
    </>
  );
}

function TeamBillingEndpoints() {
  return (
    <>
      <H2>Teamleden ophalen</H2>
      <Code>{`GET /api/v1/members`}</Code>
      <P>Retourneert alle leden van je organisatie met hun rol en toevoegdatum.</P>

      <H2>Billing informatie ophalen</H2>
      <Code>{`GET /api/billing`}</Code>
      <P>Retourneert het huidige abonnement, gebruik en plan-details.</P>

      <H2>Abonnement aanmaken</H2>
      <Code>{`POST /api/billing
Content-Type: application/json

{
  "plan": "starter"
}`}</Code>
      <P>Start een Stripe Checkout-sessie voor het gekozen plan.</P>

      <H2>Plan wijzigen</H2>
      <Code>{`PUT /api/billing
Content-Type: application/json

{
  "plan": "growth"
}`}</Code>

      <H2>Abonnement opzeggen</H2>
      <Code>{`DELETE /api/billing`}</Code>
      <Callout type="warning">
        Na opzeggen behoud je toegang tot het einde van de huidige facturatieperiode, waarna je wordt
        gedowngraded naar het Free plan.
      </Callout>
    </>
  );
}

function RateLimits() {
  return (
    <>
      <P>
        De TribeMem API hanteert rate limits om eerlijk gebruik te garanderen. Limieten zijn afhankelijk
        van je abonnement.
      </P>
      <H2>Rate limits per plan</H2>
      <Table
        headers={['Plan', 'Requests/minuut', 'Queries/maand']}
        rows={[
          ['Free', '30', '50'],
          ['Starter', '60', '500'],
          ['Growth', '120', '2.000'],
          ['Business', '300', '10.000'],
          ['Enterprise', 'Op maat', 'Onbeperkt'],
        ]}
      />
      <H2>Rate limit headers</H2>
      <P>Elke response bevat headers die je huidige gebruik tonen:</P>
      <Code>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1710500000`}</Code>
      <H2>Foutcodes</H2>
      <Table
        headers={['Code', 'Betekenis', 'Oplossing']}
        rows={[
          ['400', 'Bad Request — Ongeldig verzoek', 'Controleer je request body en parameters'],
          ['401', 'Unauthorized — Ongeldige of ontbrekende API key', 'Controleer je Authorization header'],
          ['403', 'Forbidden — Onvoldoende permissies', 'Controleer de scopes van je API key'],
          ['404', 'Not Found — Resource niet gevonden', 'Controleer het ID of pad'],
          ['429', 'Too Many Requests — Rate limit bereikt', 'Wacht en probeer opnieuw'],
          ['500', 'Internal Server Error', 'Probeer opnieuw of neem contact op met support'],
        ]}
      />
    </>
  );
}

/* ──────────────────── MCP ──────────────────── */

function WatIsMcp() {
  return (
    <>
      <P>
        MCP (Model Context Protocol) is een open standaard waarmee AI-assistenten kunnen communiceren
        met externe tools en databronnen. TribeMem biedt een MCP-server waarmee je organisatiekennis
        direct beschikbaar is in AI-tools zoals Claude Desktop, Claude Code en Cursor.
      </P>
      <H2>Waarom MCP?</H2>
      <UL>
        <li>Stel vragen aan je organisatiekennis vanuit je favoriete AI-tool.</li>
        <li>Geen context-switching meer tussen TribeMem en je werktools.</li>
        <li>AI-assistenten krijgen direct toegang tot up-to-date organisatiekennis.</li>
        <li>Bouw custom workflows die automatisch relevante kennis ophalen.</li>
      </UL>
      <H2>Ondersteunde tools</H2>
      <UL>
        <li>Claude Desktop</li>
        <li>Claude Code (CLI)</li>
        <li>Cursor</li>
        <li>Elke MCP-compatibele client</li>
      </UL>
    </>
  );
}

function McpSetup() {
  return (
    <>
      <P>
        Volg deze stappen om de TribeMem MCP-server te configureren in je AI-tool.
      </P>
      <H2>Vereisten</H2>
      <UL>
        <li>Node.js 18 of hoger</li>
        <li>Een TribeMem API key met <code className="rounded bg-muted px-1 text-sm">query:read</code> scope</li>
      </UL>
      <H2>Configuratie voor Claude Desktop</H2>
      <P>Voeg het volgende toe aan je Claude Desktop configuratie:</P>
      <Code>{`{
  "mcpServers": {
    "tribemem": {
      "command": "npx",
      "args": [
        "@tribemem/mcp-server",
        "--api-key",
        "tm_your_api_key_here"
      ]
    }
  }
}`}</Code>
      <H2>Configuratie voor Claude Code</H2>
      <Code>{`claude mcp add tribemem -- npx @tribemem/mcp-server --api-key tm_your_api_key_here`}</Code>
      <H2>Verifi&euml;ren</H2>
      <P>
        Na configuratie kun je in je AI-tool vragen stellen zoals &quot;Zoek in TribeMem hoe ons
        deployment-proces werkt&quot; en de tool zal automatisch de MCP-server aanspreken.
      </P>
    </>
  );
}

function McpTools() {
  return (
    <>
      <P>
        De TribeMem MCP-server biedt vier tools die AI-assistenten kunnen gebruiken.
      </P>
      <H2>query_knowledge</H2>
      <P>Doorzoek de kennisbank met een natuurlijke taalvraag.</P>
      <Code>{`Tool: query_knowledge
Input: { "query": "Hoe werkt ons deployment-proces?" }
Output: Gestructureerd antwoord met confidence score`}</Code>

      <H2>get_process</H2>
      <P>Haal een specifiek proces op met alle stappen.</P>
      <Code>{`Tool: get_process
Input: { "name": "code-review" }
Output: Stappen, verantwoordelijken, edge cases`}</Code>

      <H2>list_recent_decisions</H2>
      <P>Bekijk recente organisatiebeslissingen.</P>
      <Code>{`Tool: list_recent_decisions
Input: { "category": "engineering" }  // optioneel
Output: Lijst van beslissingen met context en rationale`}</Code>

      <H2>get_context</H2>
      <P>Haal contextuele informatie op over een onderwerp.</P>
      <Code>{`Tool: get_context
Input: { "topic": "PostgreSQL migratie" }
Output: Gerelateerde entiteiten, geschiedenis, confidence`}</Code>
    </>
  );
}

/* ──────────────────── SDK ──────────────────── */

function SdkInstallatie() {
  return (
    <>
      <P>
        De TribeMem SDK biedt een typed TypeScript client library voor het integreren van TribeMem
        in je eigen applicaties.
      </P>
      <H2>Installatie</H2>
      <Code>{`npm install @tribemem/sdk
# of
yarn add @tribemem/sdk
# of
pnpm add @tribemem/sdk`}</Code>
      <H2>Vereisten</H2>
      <UL>
        <li>Node.js 18 of hoger</li>
        <li>TypeScript 5.0+ (aanbevolen maar niet verplicht)</li>
        <li>Een TribeMem API key</li>
      </UL>
    </>
  );
}

function SdkConfiguratie() {
  return (
    <>
      <H2>Client initialiseren</H2>
      <Code>{`import { TribeMemClient } from '@tribemem/sdk';

const client = new TribeMemClient({
  apiKey: 'tm_your_api_key_here',
  // optioneel: custom base URL
  // baseUrl: 'https://app.tribemem.com'
});`}</Code>
      <H2>Omgevingsvariabelen</H2>
      <P>
        Het is aanbevolen om je API key als omgevingsvariabele in te stellen in plaats van hardcoded
        in je code:
      </P>
      <Code>{`// .env
TRIBEMEM_API_KEY=tm_your_api_key_here

// In je code
const client = new TribeMemClient({
  apiKey: process.env.TRIBEMEM_API_KEY!,
});`}</Code>
      <H2>TypeScript ondersteuning</H2>
      <P>
        De SDK is volledig geschreven in TypeScript en bevat type-definities voor alle endpoints,
        request- en response-objecten. Je IDE geeft automatische aanvulling en type-controle.
      </P>
    </>
  );
}

function SdkVoorbeelden() {
  return (
    <>
      <H2>Kennis doorzoeken</H2>
      <Code>{`const result = await client.query('Hoe werkt ons deployment-proces?');
console.log(result.answer);
console.log(result.confidence);
console.log(result.sources);`}</Code>

      <H2>Kenniseenheden ophalen</H2>
      <Code>{`// Alle processen ophalen
const { items, total } = await client.knowledge.list({
  type: 'process',
  category: 'engineering',
  status: 'active',
  page: 1,
  limit: 20,
});

// Enkele kenniseenheid ophalen
const item = await client.knowledge.get('knowledge-unit-id');`}</Code>

      <H2>Kenniseenheid aanmaken</H2>
      <Code>{`const newItem = await client.knowledge.create({
  title: 'Release procedure',
  content: 'We releasen elke dinsdag via CI/CD pipeline...',
  type: 'process',
  category: 'engineering',
  tags: ['release', 'ci-cd'],
});`}</Code>

      <H2>Meldingen ophalen</H2>
      <Code>{`const { alerts } = await client.alerts.list();

// Melding als gelezen markeren
await client.alerts.update('alert-id', { is_read: true });

// Melding als opgelost markeren
await client.alerts.update('alert-id', { is_resolved: true });`}</Code>

      <H2>Connectors bekijken</H2>
      <Code>{`const { connectors } = await client.connectors.list();
connectors.forEach(c => {
  console.log(\`\${c.type}: \${c.status}\`);
});`}</Code>
    </>
  );
}

/* ──────────────────── BEHEER ──────────────────── */

function OrganisatieInstellingen() {
  return (
    <>
      <P>
        Via Settings &gt; General kun je de basisinstellingen van je organisatie beheren.
      </P>
      <H2>Algemene instellingen</H2>
      <UL>
        <li><strong>Organisatienaam</strong> — De weergavenaam van je organisatie.</li>
        <li><strong>URL-slug</strong> — Gebruikt in URLs en API-aanroepen.</li>
      </UL>
      <H2>Crawler-instellingen</H2>
      <UL>
        <li><strong>Auto-crawl</strong> — Schakel automatisch crawlen in of uit.</li>
        <li><strong>Conflictdetectie</strong> — Detecteer automatisch tegenstrijdige informatie.</li>
        <li><strong>Staleness-alerts</strong> — Ontvang meldingen wanneer kennis verouderd raakt.</li>
        <li><strong>Confidence-drempel (%)</strong> — Kennis onder deze drempel wordt geflagd als onbetrouwbaar.</li>
      </UL>
      <H2>Danger Zone</H2>
      <Callout type="warning">
        In de Danger Zone kun je je volledige organisatie verwijderen. Dit is onomkeerbaar en verwijdert
        alle kennis, connectors, leden en instellingen.
      </Callout>
    </>
  );
}

function BillingPage() {
  return (
    <>
      <P>
        Via Settings &gt; Billing beheer je je abonnement, bekijk je je gebruik en beheer je je facturen.
      </P>
      <H2>Abonnementen</H2>
      <Table
        headers={['Plan', 'Prijs', 'Connectors', 'Kennis', 'Queries/mnd', 'Leden']}
        rows={[
          ['Free', 'Gratis', '1', '500', '50', '3'],
          ['Starter', '$49/mnd', '3', '5.000', '500', '10'],
          ['Growth', '$149/mnd', '8', '25.000', '2.000', '50'],
          ['Business', '$399/mnd', 'Onbeperkt', 'Onbeperkt', '10.000', '200'],
          ['Enterprise', 'Op maat', 'Onbeperkt', 'Onbeperkt', 'Onbeperkt', 'Onbeperkt'],
        ]}
      />
      <H2>Gebruik bekijken</H2>
      <P>
        Op de Billing-pagina zie je je huidige gebruik voor de lopende facturatieperiode:
        kenniseenheden, connectors, queries en teamleden.
      </P>
      <H2>Upgraden of downgraden</H2>
      <P>
        Klik op <strong>Upgrade</strong> of <strong>Downgrade</strong> om van plan te wisselen. Bij een upgrade
        krijg je direct toegang tot de extra functionaliteit. Bij een downgrade behoud je toegang tot
        het einde van de huidige periode.
      </P>
      <H2>Opzeggen</H2>
      <P>
        Klik op <strong>Cancel Subscription</strong> om je abonnement op te zeggen. Je behoudt toegang
        tot het einde van de lopende facturatieperiode.
      </P>
    </>
  );
}

function ApiKeysPage() {
  return (
    <>
      <P>
        API Keys geven programmatische toegang tot de TribeMem API. Beheer je keys via API Keys in het zijmenu.
      </P>
      <H2>Een API key aanmaken</H2>
      <OL>
        <li>Klik op <strong>Create API Key</strong>.</li>
        <li>Geef de key een beschrijvende naam (bijv. &quot;Production API&quot;).</li>
        <li>Selecteer de gewenste scopes.</li>
        <li>Klik op <strong>Create</strong>.</li>
        <li>Kopieer de key direct — deze wordt slechts &eacute;&eacute;n keer getoond.</li>
      </OL>
      <Callout type="warning">
        Bewaar je API key veilig. Deel deze nooit in publieke repositories of chatberichten.
        Als je vermoedt dat een key is gelekt, trek deze dan onmiddellijk in.
      </Callout>
      <H2>Key beheren</H2>
      <UL>
        <li><strong>Status</strong> — Bekijk of een key actief of inactief is.</li>
        <li><strong>Laatst gebruikt</strong> — Zie wanneer een key voor het laatst is gebruikt.</li>
        <li><strong>Intrekken</strong> — Klik op <strong>Delete</strong> om een key permanent in te trekken.</li>
      </UL>
    </>
  );
}

function RollenPermissies() {
  return (
    <>
      <P>
        TribeMem kent vier rollen met oplopende permissies.
      </P>
      <H2>Rollenmatrix</H2>
      <Table
        headers={['Actie', 'Viewer', 'Member', 'Admin', 'Owner']}
        rows={[
          ['Kennis bekijken', 'Ja', 'Ja', 'Ja', 'Ja'],
          ['Vragen stellen', 'Nee', 'Ja', 'Ja', 'Ja'],
          ['Kennis bewerken', 'Nee', 'Beperkt', 'Ja', 'Ja'],
          ['Connectors beheren', 'Nee', 'Nee', 'Ja', 'Ja'],
          ['Team beheren', 'Nee', 'Nee', 'Ja', 'Ja'],
          ['Instellingen wijzigen', 'Nee', 'Nee', 'Ja', 'Ja'],
          ['Billing beheren', 'Nee', 'Nee', 'Nee', 'Ja'],
          ['Organisatie verwijderen', 'Nee', 'Nee', 'Nee', 'Ja'],
        ]}
      />
      <H2>Rolbeschrijvingen</H2>
      <UL>
        <li><strong>Owner</strong> — Volledige controle over de organisatie. Kan de organisatie verwijderen en is de primaire contactpersoon voor billing.</li>
        <li><strong>Admin</strong> — Kan het team, connectors en instellingen beheren. Kan geen billing beheren of de organisatie verwijderen.</li>
        <li><strong>Member</strong> — Kan kennis bekijken en doorzoeken, met beperkte bewerkingsmogelijkheden.</li>
        <li><strong>Viewer</strong> — Alleen leestoegang tot de kennisbank. Kan geen vragen stellen of wijzigingen aanbrengen.</li>
      </UL>
    </>
  );
}

/* ──────────────────── FAQ ──────────────────── */

function FaqPage() {
  return (
    <>
      <H3>Hoe vaak wordt kennis bijgewerkt?</H3>
      <P>
        De crawler draait automatisch op regelmatige intervallen (configureerbaar in Settings).
        Daarnaast kun je handmatig een crawl starten via de Crawler-pagina. Nieuwe kennis wordt
        doorgaans binnen enkele minuten na het crawlen beschikbaar.
      </P>

      <H3>Wat gebeurt er als bronnen tegenstrijdig zijn?</H3>
      <P>
        TribeMem detecteert automatisch tegenstrijdigheden en markeert beide kenniseenheden als
        &quot;contradicted&quot;. Je ontvangt een melding zodat je de tegenstrijdigheid kunt onderzoeken
        en oplossen.
      </P>

      <H3>Hoe veilig is mijn data?</H3>
      <P>
        Alle connector-credentials worden versleuteld opgeslagen met AES-256-GCM. Data wordt opgeslagen
        in Supabase (PostgreSQL) met Row Level Security (RLS). API keys zijn gehashed en worden
        nooit in plaintext opgeslagen na creatie.
      </P>

      <H3>Kan ik kennis handmatig toevoegen of bewerken?</H3>
      <P>
        Ja. Via de Knowledge Base kun je bestaande kenniseenheden bewerken en via de API kun je nieuwe
        kenniseenheden aanmaken. Dit is handig voor kennis die niet in je gekoppelde tools staat.
      </P>

      <H3>Wat telt als &quot;query&quot; voor mijn limiet?</H3>
      <P>
        Elke vraag die je stelt via de Ask-pagina, de API (POST /api/v1/query) of de MCP-server telt
        als &eacute;&eacute;n query. Het bekijken van de Knowledge Base telt niet mee.
      </P>

      <H3>Kan ik meerdere organisaties hebben?</H3>
      <P>
        Momenteel ondersteunt TribeMem &eacute;&eacute;n organisatie per account. Als je meerdere
        organisaties nodig hebt, neem dan contact op over het Enterprise-plan.
      </P>

      <H3>Welke talen worden ondersteund?</H3>
      <P>
        TribeMem ondersteunt alle talen die door de AI-modellen worden ondersteund. Kennis wordt
        geëxtraheerd en beantwoord in de taal van de bron. Je kunt vragen stellen in elke taal.
      </P>

      <H3>Hoe kan ik support bereiken?</H3>
      <UL>
        <li><strong>Free plan:</strong> E-mail support</li>
        <li><strong>Starter plan:</strong> Priority e-mail support</li>
        <li><strong>Growth plan:</strong> Chat support</li>
        <li><strong>Business plan:</strong> Dedicated account manager</li>
        <li><strong>Enterprise plan:</strong> 24/7 support met SLA</li>
      </UL>
    </>
  );
}

/* ──────────────────── CONTENT MAP ──────────────────── */

export const docsContent: Record<string, Record<string, React.ComponentType>> = {
  'aan-de-slag': {
    welkom: Welkom,
    'account-aanmaken': AccountAanmaken,
    'organisatie-opzetten': OrganisatieOpzetten,
    'eerste-connector': EersteConnector,
    'eerste-vraag': EersteVraag,
  },
  kernconcepten: {
    kenniseenheden: Kenniseenheden,
    'confidence-scores': ConfidenceScores,
    'temporele-versioning': TemporeleVersioning,
    bronverwijzingen: Bronverwijzingen,
  },
  functies: {
    dashboard: Dashboard,
    ask: AskPage,
    'knowledge-base': KnowledgeBase,
    connectors: ConnectorsPage,
    crawler: CrawlerPage,
    meldingen: MeldingenPage,
    'team-beheer': TeamBeheer,
  },
  integraties: {
    slack: SlackIntegration,
    notion: NotionIntegration,
    jira: JiraIntegration,
    github: GitHubIntegration,
    linear: LinearIntegration,
    discord: DiscordIntegration,
    'google-drive': GoogleDriveIntegration,
    hubspot: HubSpotIntegration,
    freshdesk: FreshdeskIntegration,
  },
  api: {
    authenticatie: ApiAuthenticatie,
    'knowledge-endpoints': KnowledgeEndpoints,
    'alerts-endpoints': AlertsEndpoints,
    'connectors-endpoints': ConnectorsEndpoints,
    'team-billing-endpoints': TeamBillingEndpoints,
    'rate-limits': RateLimits,
  },
  mcp: {
    'wat-is-mcp': WatIsMcp,
    setup: McpSetup,
    'beschikbare-tools': McpTools,
  },
  sdk: {
    installatie: SdkInstallatie,
    configuratie: SdkConfiguratie,
    voorbeelden: SdkVoorbeelden,
  },
  beheer: {
    'organisatie-instellingen': OrganisatieInstellingen,
    billing: BillingPage,
    'api-keys': ApiKeysPage,
    'rollen-permissies': RollenPermissies,
  },
  faq: {
    'veelgestelde-vragen': FaqPage,
  },
};
