# LeadRadar Plan de dashboard și specificație de produs

25 septembrie 2026. Companion pentru whitepaper v3. Acesta este un plan de implementare, nu o aplicație deja construită. Exemplele de companii și scoruri de mai jos sunt fictive.

## 1. Scop și principii

Utilizatorul trebuie să poată răspunde rapid la cinci întrebări: ce companie, ce serviciu, de ce acum, ce dovadă și ce fac mai departe? Pentru manager, întrebarea suplimentară este dacă recomandările sunt folosite și utile.

- Un scor aparține unei combinații companie-serviciu și unei versiuni de reguli.
- Licitațiile au evaluare separată pe procedură și lot. Scorurile T și P nu sunt amestecate într-un singur clasament.
- Datele necunoscute, conflictuale sau vechi rămân vizibile.
- Orice acțiune CRM arată destinația și conținutul înaintea confirmării.
- O singură identitate de companie confirmată leagă sursele, CRM-ul și contabilitatea; asocierea ambiguă oprește scrierile.
- Un indicator de calitate nu este o garanție sau o probabilitate de câștig.

## 2. Practici ale concurenților și adaptarea lor

| Referință | Practică documentată | Decizie LeadRadar |
| --- | --- | --- |
| Common Room | Reguli de fit și behavior, ponderi și factori vizibili în profil. | Separăm ICP, semnale, acoperire și blocaje; click pe scor deschide calculul. |
| Apollo | Filtre, căutări salvate și alerte pentru rezultatele actualizate. | Vederi persistente precum „Securitate România” și „Conturile mele de verificat”. |
| Clay | Monitorizare configurabilă și extragere de semnale personalizate. | Configurare pe serviciu și sursă, cu starea execuțiilor și costul cercetării. |
| 6sense și Demandbase | Context de cont legat de acțiunile echipei comerciale. | Un panou de acțiune cu responsabil, context CRM și următorul pas. |

Surse: [Common Room Scores](https://www.commonroom.io/docs/set-preferences/scores/), [Apollo Saved Searches](https://knowledge.apollo.io/hc/en-us/articles/4409803718669-Save-Share-and-Set-Alerts-for-Searches), [Clay Custom Signals](https://university.clay.com/docs/custom-signals), [6sense](https://6sense.com/), [Demandbase](https://www.demandbase.com/products/account-intelligence/intent/).

Acestea sunt observații din documentația furnizorilor, nu un studiu comparativ de utilizabilitate. Nu copiem brandingul, textele sau interfețele pixel cu pixel. Diferențierea propusă este procesul adaptat vânzării serviciilor IT și contextului relației existente.

## 3. Roluri și permisiuni

| Rol | Poate face | Restricții |
| --- | --- | --- |
| Sales / KAM | Consultă conturi permise, verifică dovezi, propune acțiuni, dă feedback. | Nu publică reguli globale și nu vede automat toate datele financiare. |
| Presales / bidding | Verifică loturi, cerințe și fezabilitate; propune bid/no-bid. | Nu poate declara îndeplinite condiții fără dovezi. |
| Manager / administrator | Configurează produse, reguli, vederi partajate și acces; publică versiuni. | Accesul trebuie verificat și pe server, nu numai în UI. |

MVP poate avea două roluri implementate: sales și admin; rolul bidding devine un set de permisiuni ulterior. Pentru fiecare cont există un tenant, iar filtrarea tenantului este obligatorie inclusiv în MCP.

## 4. Navigare și prioritate de livrare

| Rută propusă | Ecran | Prioritate |
| --- | --- | --- |
| /opportunities | Prioritățile mele și lista pe produs | P0 |
| /companies/:id | Profil, dovezi și scoruri | P0 |
| /products/:id/rules | ICP și editor de reguli cu simulare | P0, editor restrâns |
| /review | Asocieri ambigue și dovezi contradictorii | P0, poate fi o vedere filtrată |
| /tenders | Lista de proceduri/loturi | P1; un dosar demonstrativ în MVP |
| /tenders/:id/lots/:lotId | Eligibilitate și dosar de licitație | P1 |
| /research | Joburi, documente și acoperire | P0 minimal |
| /integrations | Conexiuni și stări de sincronizare | P0 pentru CRM; P1 pentru catalog |
| /results | Feedback și rezultate măsurate | P0 logging; P1 rapoarte |

P0 este necesar pentru traseul de bază. P1 se face după ce P0 este demonstrabil; nu înseamnă o promisiune de implementare a tuturor ecranelor la hackathon.

## 5. Wireframe pentru pagina de priorități

```text
LeadRadar   [Spațiu de lucru]                         [Utilizator]

Priorități  Companii  Licitații  Produse  Cercetare  Integrări

Prioritățile mele                         [Pornește cercetarea]
[Serviciu: Securitate] [România] [Proprietar] [Stare] [Mai multe]
[Vedere salvată]    [Salvează vederea]       Actualizat: 14:32

De verificat: 8   Acceptate: 3   Cu date incomplete: 4
Perioadă: ultimele 7 zile     Context: serviciul și filtrele curente

Companie       Prioritate  De ce acum       Acoperire   Acțiune
Demo Industrial   71     Modernizare IT       100%     Detalii
Demo Retail       --     Identitate ambiguă     40%     Verifică
Demo Services     48     Recrutare cloud        70%     Detalii

Click pe rând -> panou cu dovezi, scor, necunoscute și draft
Click pe scor -> calcul pe reguli și istoric
```

Numerele sunt date de design fictive. „Acoperire” în listă reprezintă C; K este disponibil separat în detaliu. O identitate ambiguă afișează „--” în lista de acțiune chiar dacă există un calcul intern provizoriu.

Lista are paginare, sortare stabilă și filtre păstrate în URL. Pentru același scor, ordonarea secundară poate folosi actualizarea și ID-ul, fără rearanjări aleatoare. Schimbarea produsului resetează pragurile incompatibile și explică schimbarea.

Coloane suplimentare: industrie, angajați/an, venit/monedă/an, responsabil, ultimul semnal, surse disponibile și starea CRM. Nu afișăm implicit un tabel de 20 de coloane. „Toate produsele” este o matrice informativă, nu un clasament comun fără calibrare.

## 6. Profil și panou de dovezi

Header: nume legal, țară, identificator confirmat, relația de grup, responsabil și data actualizării. Utilizatorul vede explicit dacă profilul este persoana juridică sau grupul.

Zona principală are:

1. Scor pe serviciul selectat: P, F, R, N, K, C, eligibilitate, versiune, calculat la.
2. „De ce acum”: maximum trei motive susținute, nu un rezumat generic.
3. „Ce nu știm”: întrebări nerezolvate, date lipsă și surse blocate.
4. Dovezi: citat, URL, editor, data evenimentului, data publicării, colectat la, pagină, stare de validare.
5. Relație comercială: potrivire CRM/contabilitate, responsabil și servicii confirmate sau necunoscute.
6. Acțiune propusă: verificare, discuție, extindere, actualizare oportunitate sau arhivare.

Nu ascundem sursa în spatele unui tooltip. Citatul este selectabil, linkul se deschide separat, iar documentele duplicate sunt grupate sub eveniment. O etichetă „verificare automată trecută” nu este sinonim cu „revizuit uman”.

Deschiderea unui panou păstrează selecția în tabel. Escape îl închide și readuce focusul la rând. Pe mobil se folosește pagină dedicată; nu comprimăm trei coloane într-un drawer îngust.

## 7. Explicația scorului și configurabilitate

Formula v1 propusă în whitepaper este P = clamp(0,35F + 0,65R - N, 0, 100). În detaliu afișăm contribuția fiecărei reguli, plafonul grupului, coeficientul de calitate și actualitate, precum și dovezile folosite.

Pentru exemplul fictiv: R = 18 + 22,4 + 20 = 60,4; F = 90; N = 0; P = 70,76, rotunjit 71. UI nu trebuie să însumeze procente incompatibile sau valori deja rotunjite.

Editorul include:

- nume serviciu și versiune a catalogului;
- țări, industrie, dimensiune, venit și sursa/perioada cerută;
- întrebarea în limbaj natural și semnificația răspunsurilor;
- pondere, tip pozitiv/negativ și grup de corelație;
- criteriu obligatoriu sau preferință, distinct vizual;
- înjumătățire temporală, tratamentul datei necunoscute și surse acceptate;
- prag de acoperire și prag de prioritate.

Flux: salvează draft -> simulează pe un set fix -> vezi diferențele -> publică versiunea. Simularea arată conturi promovate/retrogradate și explicația; nu modifică sarcini deja trimise. Recalcularea are progres vizibil. În timpul ei, rândurile păstrează versiunea veche sau nouă explicit, fără amestec ascuns.

MVP permite editarea întrebării, ponderii și unui criteriu de excludere. Nu este necesar un constructor vizual complex de reguli arbitrare.

## 8. Tender intelligence

Intrări: API oficial, e-mail autorizat sau fișier importat. O notificare generează un candidat; statutul și termenele se verifică în anunțul oficial. Deducerea „are sigur buget aprobat” nu este permisă din simpla existență a unui anunț.

Lista arată beneficiar, procedură și lot, serviciu, stare, deadline cu fus orar, eligibilitate, T provizoriu/final și responsabil. Deadline-ul are text, nu numai culoare. O atribuire istorică nu apare între procedurile active.

Dosarul include matricea:

| Cerință | Sursa/pagina | Răspunsul echipei | Dovadă internă | Blocaj |
| --- | --- | --- | --- | --- |
| Certificare cerută | Document și pagină | Neconfirmat | Lipsește | Necesită verificare |
| Capacitate tehnică | Document și pagină | Îndeplinit | Referință aprobată | Nu |

Valorile tabelului sunt fictive. Condițiile legale și procedurale sunt verificate de responsabilul ofertării, iar sistemul nu declară automat conformitatea.

Acțiuni: atribuie presales, cere verificare, propune participarea, nu participăm și generează dosar. Decizia înregistrează utilizator, moment, versiune a anunțului și motiv. La rectificare, se afișează diferențele și cerințele afectate; o schimbare materială cere revizuirea deciziei.

## 9. Draft de pâlnie comercială personalizată

Pentru fiecare oportunitate acceptată, sistemul propune un plan editabil, nu îl execută automat:

| Etapă | Ieșire generată | Validare |
| --- | --- | --- |
| Context | Ce s-a observat, sursele și produsul relevant | KAM confirmă relevanța. |
| Descoperire | Întrebări despre nevoie, calendar, responsabil și suport extern | Nu presupunem bugetul sau decidentul. |
| Primul contact | Draft e-mail sau puncte pentru apel | Utilizatorul editează și aprobă. |
| Urmărire | Sarcină și dată agreată; fără secvențe automate implicite | Respectă starea din CRM. |
| Oportunitate | Rezultatul discuției și următorul pas | Calificare de către echipa comercială. |
| Feedback | Acceptat/respins, motiv, câștigat/pierdut ulterior | Păstrăm versiunea scorului de la momentul deciziei. |

Pentru tender, etapele sunt eligibilitate, întrebări de clarificare, bid/no-bid, pregătire, revizuire, depunere și rezultat. Termenele provin din documente; datele interne de lucru sunt propuneri ajustate de echipă.

## 10. Stări și comportament în caz de eroare

| Stare | Ce vede utilizatorul | Ce poate face |
| --- | --- | --- |
| Cercetare în curs | Etapa și ultima actualizare; datele existente rămân vizibile | Continuă lucrul sau deschide jurnalul. |
| Zero rezultate | Nicio companie corespunde filtrelor curente | Elimină filtre sau schimbă produsul. |
| Sursă blocată | Sursa și impactul asupra acoperirii | Adaugă URL/document alternativ autorizat. |
| Identitate ambiguă | Candidați și diferențe | Confirmă asocierea sau păstrează separat. |
| Conflict între surse | Ambele afirmații și datele | Trimite la revizuire. |
| Conexiune CRM expirată | Draft păstrat, nicio confirmare falsă de succes | Reconectează sau solicită administratorului. |
| Răspuns neclar la scriere | Acțiunea apare în verificare | Reconciliere după idempotency key înainte de retry. |
| Acces insuficient | Explicație fără date confidențiale | Cere acces responsabilului. |

Conținutul e-mailurilor, paginilor și PDF-urilor este neîncrezător; nu poate comanda trimiterea de mesaje sau schimbarea regulilor. Crawlerul nu accesează adrese interne doar fiindcă sunt într-un e-mail.

## 11. Măsurare și accesibilitate

Evenimente: research_started/completed/failed, evidence_opened, score_explained, recommendation_accepted/rejected, identity_resolved, draft_created, crm_action_confirmed/succeeded/failed și tender_decision_recorded. Păstrăm ID-uri, tenant, product_id și score_version; nu copiem secrete sau întregul text financiar în analytics.

Metrici cu perioadă și numitor:

- recomandări acceptate / recomandări revizuite;
- Precision@20 evaluat pe serviciu, cu dimensiunea lotului;
- asociere corectă pe cazuri etichetate;
- timpul median de la deschiderea cazului la o decizie, cu metodologia explicată;
- rata de succes a acțiunilor CRM și durata sincronizării;
- acoperire de cercetare și procent de surse indisponibile.

Nu afișăm automat „56,7 ore economisite” sau o creștere de conversie fără măsurare. Feedback-ul observat asupra topului nu reprezintă un eșantion neutru al tuturor firmelor; păstrăm un lot separat pentru evaluare și audităm respingerile.

Testele de accesibilitate acoperă tastatura, focusul, contrastele, antetele de tabel, etichetele butoanelor și mesajele de status. Nu transmitem semnificația numai prin roșu/verde. [Principii W3C](https://www.w3.org/WAI/fundamentals/accessibility-principles/).

## 12. Contracte de date pentru frontend și MCP

API-urile propuse sunt contracte de proiect, nu endpoint-uri existente:

- GET /api/opportunities?product_id=...&status=...&cursor=...
- GET /api/companies/:id/assessments?product_id=...
- GET /api/evidence/:id
- POST /api/research-runs
- POST /api/rule-versions/:id/simulate
- POST /api/rule-versions/:id/publish
- POST /api/recommendations/:id/feedback
- POST /api/crm-actions/preview
- POST /api/crm-actions/:id/confirm
- GET /api/tenders/:id/lots/:lotId

Evaluarea returnează company_id, product_id, score_version, evaluated_at, F, R, N, P, K, C, eligibility_status, identity_status, contributions, evidence_ids și limitations. Procentele au un interval documentat, iar câmpurile necunoscute sunt null cu motiv, nu șiruri goale sau zero fals.

MCP folosește aceleași servicii backend. O cerere de explicație poate specifica versiunea; dacă solicită starea curentă, răspunsul precizează versiunea efectivă. Recalcularea nu schimbă retrospectiv istoricul unei acțiuni confirmate.

## 13. Ordinea de lucru pentru echipă

1. PM confirmă serviciul principal, criteriile ICP, rubrica de relevanță și 3–5 cazuri de demo.
2. Backend 1 definește identitățile, documentele și colectarea asincronă, inclusiv stările de eșec.
3. Backend 2 definește extracția, validarea, formula și testele de scoring; feedback-ul este stocat din prima versiune.
4. Frontend implementează lista, panoul de dovezi și explicația scorului pe contractele comune; datele simulate sunt etichetate.
5. Echipa integrează un caz complet înainte de a extinde sursele sau ecranele.
6. Se adaugă previzualizarea și scrierea într-un CRM de test, apoi importul contabil cu potrivire confirmată.
7. Se demonstrează un lot de tender; conectorul live de e-mail/API este ulterior dacă accesul nu este pregătit.
8. Se conectează două operații MCP de citire dacă nucleul este stabil, apoi se face verificarea de utilizabilitate și repetiția demo-ului.

Nu presupunem un număr fix de ore rămase. La începutul implementării, planul se ajustează la deadline și la conturile efectiv autorizate.

## 14. Criterii de acceptare pentru demo

- Aceeași companie are scoruri explicate separat pentru două servicii.
- Duplicarea unui articol nu crește scorul.
- O identitate ambiguă și o factură generică produc stări necunoscute, nu concluzii inventate.
- O regulă modificată poate fi simulată și publicată cu versiune nouă.
- Filtrele și poziția listei se păstrează la întoarcerea din profil.
- O dovadă este accesibilă direct din scor.
- Un tender expirat sau anulat nu poate fi recomandat ca activ.
- O scriere CRM repetată nu dublează sarcina.
- Interfața poate fi parcursă cu tastatura.
- Datele fictive/importate/cache și funcțiile neimplementate sunt etichetate corect.

## 15. Decizii asupra materialului primit

Adoptăm cercetarea pe surse, scoring-ul pe produs, monitorizarea licitațiilor, specializarea inițială și instrumentarea feedback-ului. Corectăm afirmațiile că Termene ar fi implicit gratuit, că JSON garantează precizia, că fiecare tender are buget sigur sau urgență maximă și că lipsa unei asocieri în CRM dovedește un client nou.

Nu preluăm promisiunea de creștere 2%→15%, afirmația că niciun competitor nu poate integra contabilitatea, penalizarea automată pentru capacități IT interne sau recomandarea de a folosi domeniul drept identificator juridic universal. MCP rămâne un canal al produsului, cu prioritate după logica de bază; nu eliminăm această direcție numai pentru că o recomandare din document o propune.
