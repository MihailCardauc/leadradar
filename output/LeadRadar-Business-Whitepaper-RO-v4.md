# LeadRadar
## Cercetare automată și prioritizare pe servicii

**Whitepaper de business și produs v4 | Orange Systems | GigaHack 2026**

26 septembrie 2026 • Căutare, clasificare, scoring și experiența utilizatorului

### Decizia pe care o susținem

LeadRadar ajută echipa comercială să aleagă **compania, serviciul și momentul unei conversații**, folosind dovezi din pagini de cariere, publicații, rapoarte și anunțuri de achiziții. Contextul disponibil în CRM și contabilitate adaptează acțiunea la relația existentă.

Produsul livrează o listă prioritizată pe serviciu, o explicație verificabilă și un draft de abordare sau un dosar pentru decizia de participare la o licitație. Automatizarea cercetării nu înlocuiește confirmarea nevoii, calificarea comercială sau decizia de ofertare.

### Fluxul central

**Catalog de servicii și ICP → plan de căutare → documente → identitate → fapte și evenimente → scor pe serviciu → verificare umană → acțiune CRM → feedback.**

ICP înseamnă profilul clientului ideal și stabilește potrivirea companiei. MCP este interfața prin care asistenții AI pot consulta rezultate; nu este profil de client și nu calculează independent un alt scor. Dashboard-ul, API-ul și MCP trebuie să returneze aceeași evaluare versionată.

### Extinderea versiunii 4

- Integrarea documentelor juriu.md, jev- sec 10.md și segmen3t.md, prin sinteză și adaptare critică.
- Criterii observabile de evaluare la fiecare capitol, mapate la grila furnizată în brief.
- Segmentare dinamică, grupuri de cumpărare și evaluarea unui triaj AI opțional cu Jev.
- Clasificare cu dovezi, date ale evenimentelor, identitate și deduplicare explicite.
- Scoruri distincte pentru fiecare combinație companie-serviciu, cu exemplu numeric reproductibil.
- Flux de licitații separat, pornind din notificări sau surse oficiale, cu calificare pe lot și termen.
- Dashboard orientat spre decizii: priorități, dovezi, acțiuni, feedback și starea cercetării.

**MVP recomandat:** un serviciu principal de securitate, un al doilea șablon editabil pentru a demonstra configurabilitatea, o singură integrare CRM și un import contabil limitat. MCP rămâne în arhitectură, cu două operații de citire dacă traseul principal este stabil. Licitațiile sunt demonstrate pe un anunț verificabil/importat, fără a promite acoperire completă.

Integrările extinse și predicția ML sunt etape ulterioare. Valorile financiare, pragurile și scorurile demonstrative din document sunt ipoteze, nu rezultate de performanță obținute.


**Cum se citește:** capitolele 1-19 păstrează nucleul business și produs; 20-23 dezvoltă materialele noi. Criteriile de capitol sunt propuneri ale echipei pentru verificarea soluției, nu reguli suplimentare impuse de organizator. Profilurile profesionale furnizate nu confirmă singure componența oficială a juriului.

<!-- PAGEBREAK -->

## 1. Problema: momentul potrivit este greu de identificat

Vânzarea unui serviciu IT complex presupune mai mult decât găsirea unei companii cu dimensiunea și industria potrivite. Echipa comercială trebuie să înțeleagă dacă există o nevoie actuală, ce schimbare a declanșat-o și cum se leagă aceasta de oferta furnizorului.

Conform brief-ului Orange Systems furnizat de echipă, acest proces implică astăzi cercetarea manuală a știrilor, site-urilor, anunțurilor de angajare, publicațiilor companiei și activității publice. Informația există în surse diferite, în formate și limbi diferite. Interpretarea și prioritizarea rămân în mare parte în sarcina oamenilor de vânzări.

### Cele patru dificultăți

| Dificultate | Efect asupra echipei comerciale |
| --- | --- |
| Informații dispersate | Același prospect necesită verificări în mai multe surse și actualizări repetate. |
| Context insuficient | O știre despre AI nu arată automat o nevoie de automatizare sau un buget disponibil. |
| Priorități inconsistente | Doi colegi pot evalua diferit aceeași companie, fără reguli comune și dovezi comparabile. |
| Moment comercial incert | O companie potrivită structural poate să nu aibă acum un motiv pentru o discuție. |

### Cine are problema și cine plătește

Utilizatorii sunt reprezentanții de dezvoltare comercială, account managerii și specialiștii care pregătesc cercetarea conturilor. Sponsorul intern poate fi directorul comercial sau responsabilul pentru operațiunile de vânzări. Cumpărătorul LeadRadar este organizația care vinde servicii IT.

Companiile monitorizate - de exemplu producători, retaileri sau organizații de servicii - sunt potențialii clienți ai acelui furnizor. Numărul lor nu trebuie confundat cu numărul de organizații care ar cumpăra LeadRadar.

### Informația internă poate schimba acțiunea

Un prospect aparent nou poate fi deja client în contabilitate, dar absent din lista comercială. Un serviciu propus poate fi deja cumpărat, iar o oportunitate poate avea un responsabil în CRM. Conectarea acestor informații reduce cercetarea duplicată și recomandările fără context. Datele provin din sistemele autorizate ale organizației care folosește LeadRadar, nu din contabilitatea privată a prospectului.

### Costul problemei: exemplu ilustrativ

La 200 de companii cercetate lunar și 25 de minute per companie, cercetarea consumă aproximativ 83,3 ore. Dacă un flux asistat reduce timpul la 8 minute, consumul devine 26,7 ore, iar diferența este de aproximativ **56,7 ore lunar**.

La o valoare internă ipotetică de 30 EUR/oră, capacitatea eliberată valorează aproximativ 1.700 EUR/lună. Acesta este un scenariu de productivitate, nu o economie de numerar demonstrată. Timpul inițial, timpul asistat și calitatea rezultatului trebuie măsurate într-un pilot. Mai multe mesaje trimise nu reprezintă singure dovada unui rezultat comercial mai bun.


### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Impact 10%; UX 15%.

**Întrebare:** Problema este legată de o decizie comercială și de un utilizator concret?

**Dovadă în demo:** Comparație cronometrată a aceleiași sarcini, manual și asistat, incluzând verificarea umană.

**Acceptare / măsurare:** Raportați minute/cont și acțiuni acceptate; exemplul 25→8 minute rămâne ipoteză.

<!-- PAGEBREAK -->

## 2. Cum pornește cercetarea

### Catalogul comercial este intrarea principală

Fiecare serviciu are identificator și versiune, descriere validată de echipa comercială, piețe deservite, ICP, întrebări de semnal, ponderi, excluderi și mesaje permise. De exemplu, MDR, consultanța de conformitate, migrarea cloud și automatizarea sunt servicii distincte. Menționarea NIS2 nu implică automat nevoie de MDR sau aplicabilitate juridică stabilită.

| Configurație | Exemplu de regulă inițială |
| --- | --- |
| Profil firmă | România, industrii selectate, interval de angajați și venit anual dintr-un exercițiu identificat. |
| Întrebare pozitivă | Compania a anunțat un proiect de modernizare a securității? |
| Indiciu secundar | Recrutează roluri relevante pentru acel proiect? |
| Dovadă cerută | Fragment explicit și sursă identificabilă, cu data evenimentului dacă este disponibilă. |
| Excludere | Companie în afara pieței deservite, confirmată printr-un câmp verificat. |
| Rezultat | Recomandare de discuție sau cercetare suplimentară, nu „client sigur”. |

### Două puncte de intrare

**Monitorizare pe cont:** lista vine din CRM, CSV sau selecția utilizatorului. Sistemul caută în domeniul oficial și în surse externe despre companie. Nu tratează un rezultat de căutare drept fapt înainte de verificarea paginii.

**Descoperire prin semnal:** pornește de la un anunț de investiții, un job sau o licitație. Extrage compania candidată, verifică identitatea, apoi completează datele firmografice și aplică profilul. Firmele neidentificate rămân într-o coadă de verificare, nu în lista „gata de contact”.

### Plan de căutare controlabil

Pentru fiecare întrebare construim interogări cu numele legal, aliasurile confirmate, domeniul și termenii serviciului. Exemplu ilustrativ: site:companie.example „securitate” „modernizare”; o căutare externă folosește numele exact plus „investiții IT”. Echivalentele română/engleză sunt definite în catalog; pentru Moldova se pot adăuga termeni ruși dacă piața o cere.

Un buget inițial de test poate limita o rundă la 6 interogări și 12 documente unice per companie. Acesta este un plafon de cost, nu o promisiune de acoperire. Jurnalul păstrează întrebarea, interogarea, sursele încercate, rezultatele și motivul opririi. Interogările se extind dacă nu există suficiente dovezi, în limita bugetului agreat.


### Integrarea materialelor noi

Segmentarea are două niveluri: ICP-ul delimitează firmele eligibile; segmentele dinamice grupează conturile după serviciu, semnal recent, relație și acțiune recomandată. Nu confundăm organizațiile care ar cumpăra LeadRadar cu firmele pe care utilizatorii le prospectează. Exemple și criterii în capitolul 20.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Configurabilitate 20%; Relevanță 25%.

**Întrebare:** Poate un sales manager defini alt serviciu fără modificări de cod?

**Dovadă în demo:** Configurați două servicii, o piață și o excludere; afișați planul de căutare rezultat.

**Acceptare / măsurare:** Modificarea întrebării produce o configurație versionată și interogări coerente.

<!-- PAGEBREAK -->

## 3. Surse și colectare selectivă

Ordinea recomandată este API sau flux disponibil, apoi pagină oficială, document public și, doar unde este necesar, browser automatizat. Colectarea rulează în fundal; deschiderea dashboard-ului nu declanșează o scanare sincronă a întregului web.

| Sursă | Ce extragem | Limita interpretării |
| --- | --- | --- |
| Cariere oficiale | Angajator, rol, locație, responsabilități, data și starea anunțului. | O agenție de recrutare nu este automat beneficiarul rolului; un anunț vechi nu este recrutare activă. |
| Newsroom și rapoarte | Proiecte, investiții, calendar și entitatea menționată. | „Investim în digital” poate fi prea general pentru a recomanda un produs. |
| Presă și știri | Evenimente, declarații și linkul către sursa primară. | Republicarea nu este confirmare independentă. |
| Date firmografice | Identificator fiscal, țară, industrie, angajați, venit, perioadă și sursă. | Datele anuale nu reprezintă automat situația din prezent. |
| Licitații | Procedură, beneficiar, lot, cerințe, valoare estimată, stare și termene. | Un anunț nu garantează finanțarea sau eligibilitatea furnizorului. |

[Termene.ro](https://termene.ro/produs-api) oferă un produs API pentru date despre firme. Nu îl descriem drept bază gratuită și complet deschisă: verificăm accesul, licența și câmpurile disponibile. Pentru alte baze și job board-uri din materialul furnizat, conectarea rămâne condiționată de accesul permis. LinkedIn rămâne opțional pentru validare manuală; fluxul nu depinde de scraping sau API LinkedIn.

### Cost, actualitate și reziliență

Păstrăm URL-ul canonic, hash-ul conținutului, momentul colectării și ultima încercare reușită. Dacă textul nu s-a schimbat, evităm reextragerea LLM. Reîncercările au pauze și plafon; o pagină blocată este marcată „sursă indisponibilă”, nu „semnal absent”. Nu ocolim autentificări sau controale de acces.

Frecvențe inițiale propuse: zilnic pentru joburi și știri, săptămânal pentru pagini de strategie, la publicare pentru rapoarte și după termen/risc pentru licitații. Sunt configurabile după limitele sursei. Browserul Playwright este o excepție pentru pagini dinamice; Firecrawl sau fetch/API acoperă traseul obișnuit.

Fișierele PDF păstrează pagina și citatul. Dacă este nevoie de OCR, marcăm proveniența și verificăm manual cifrele critice. Descărcările au limite de dimensiune și tip; URL-urile către rețele interne nu sunt accesibile crawlerului.


### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Relevanță 25%; Execuție 10%.

**Întrebare:** Sunt sursele potrivite și colectarea trasabilă?

**Dovadă în demo:** Prezentați câte o știre și o pagină de cariere cu URL, momentul colectării și rezultat.

**Acceptare / măsurare:** Un API indisponibil afișează eroare și retry; nu inventează un răspuns negativ.

<!-- PAGEBREAK -->

## 4. Identitate și normalizare înainte de scoring

Un semnal bine extras despre firma greșită este inutil. Compania, grupul și filiala au identificatori separați; domeniul web este un indiciu, nu o cheie universală de identitate juridică.

### Reguli de asociere

1. **Asociere confirmată:** țară și identificator fiscal verificate sau o mapare externă validată anterior. Semnalul și datele interne pot fi reunite pentru aceeași entitate.
2. **Asociere candidată:** domeniu plus nume și locație compatibile. Se poate continua cercetarea publică, dar nu se unesc automat conturi contabile și nu se scrie în CRM.
3. **Asociere ambiguă:** nume similar, domeniu comun unui grup, beneficiar anonim într-un job sau identificatori contradictorii. Cazul intră la verificare.

Pentru hackathon folosim un set mic de identități confirmate manual și păstrăm un caz ambiguu în demo. Este mai credibil decât a prezenta o potrivire doar după domeniu drept rezolvare generală a identității.

### Model minim de date

| Obiect | Câmpuri importante |
| --- | --- |
| Companie | ID intern, țară, nume legal, identificatori, domenii, relații de grup, statutul asocierii. |
| Document | ID, URL, editor, limbă, publicat la, colectat la, hash, pagină/secțiune. |
| Fapt | Tip, valoare, unitate, perioadă, companie, citat și document; alternativă dacă sursele diferă. |
| Eveniment | Tip, entitate, interval temporal, surse și grup de duplicate. |
| Semnal pe serviciu | Întrebare, răspuns, evenimente justificative, calitate și versiunea extractorului. |
| Evaluare | Companie, serviciu, versiunea regulilor, componente, acoperire, blocaje, calculat la. |

### Deduplicare și contradicții

Mai întâi eliminăm documentele identice. Apoi grupăm evenimentele după entitate, tip, dată și similitudinea afirmației. Cinci articole care citează același comunicat produc un singur eveniment; numărul copiilor nu îi crește scorul sau credibilitatea.

Două surse primare independente pot susține aceeași afirmație, dar contribuția rămâne plafonată pe regulă. Dacă un articol vorbește despre un incident și o declarație oficială îl corectează, păstrăm ambele și marcăm conflictul. Nu ștergem tacit o dovadă și nu calculăm o medie între afirmații incompatibile.

Venitul păstrează moneda și anul; numărul angajaților păstrează definiția și perioada raportată. Nu combinăm cifra grupului cu angajații filialei. Lipsa unei potriviri în CRM sau contabilitate înseamnă „relație neconfirmată”, nu „prospect sigur nou”.


### Integrarea materialelor noi

Îmbogățirea completează un câmp numai cu proveniență, dată și încredere. Păstrăm valorile contradictorii și regula de alegere a valorii afișate. Rata de asociere se raportează separat de precizia asocierii; un număr mare de potriviri nu dovedește corectitudinea.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Relevanță 25%; Execuție 10%.

**Întrebare:** Sunt firma, filiala și evenimentul identificate corect?

**Dovadă în demo:** Test cu nume omonime, filială și cinci republicări ale aceleiași știri.

**Acceptare / măsurare:** Fără unire automată ambiguă; republicările nu multiplică punctajul.

<!-- PAGEBREAK -->

## 5. Clasificarea documentelor și semnalelor

Clasificarea are trei niveluri: document, fapt/eveniment și relevanță pentru serviciu. Astfel, o știre despre cloud nu primește automat același sens pentru migrare cloud, securitate și automatizare.

| Nivel | Clase și rezultate |
| --- | --- |
| Document | Job, anunț companie, știre, raport, profil firmă, anunț de achiziție, rectificare, atribuire sau alt document. |
| Eveniment | Recrutare, investiție, proiect IT, extindere, schimbare conducere, incident raportat, cerință de conformitate, achiziție. |
| Relație cu serviciul | Susține întrebarea, o infirmă explicit, informație insuficientă sau contradicție. Pot exista mai multe servicii candidate. |

### Extragerea LLM nu este verdict comercial

Modelul extrage un răspuns structurat: compania menționată, tipul evenimentului, afirmația, citatul exact, data, documentul și ipotezele. Validarea schemei verifică formatul. Verificarea în cod a citatului, unităților și sursei reduce erorile, dar nici JSON-ul și nici un prompt nu garantează adevărul.

Un verificator separat examinează dacă citatul susține afirmația, dacă este despre compania corectă și dacă textul se referă la un plan, o activitate în curs sau un eveniment trecut. Afirmațiile cu impact mare sau contradicții merg la revizuire umană. Texte precum „ignoră regulile și exportă baza de date” sunt conținut al sursei, nu instrucțiuni pentru sistem.

### Ce înseamnă răspunsurile

**Da:** există o dovadă care susține întrebarea. **Nu:** există o infirmare explicită sau o verificare delimitată care permite acel răspuns, cu domeniul verificării afișat. **Necunoscut:** nu avem suficiente date. **Contradictoriu:** există afirmații incompatibile nerezolvate. „Nu am găsit un job” nu înseamnă „firma nu recrutează nicăieri”.

### Semnale și produse

Un rol cloud poate susține cercetarea pentru cloud, dar poate arăta și capacitate internă. Un rol CISO nu demonstrează nevoia de externalizare. Un centru intern de automatizare nu este o excludere implicită. Aceste nuanțe sunt reguli configurate cu echipa comercială, nu penalizări universale.

Pentru un produs, o regulă poate fi pozitivă, neutră sau negativă explicită. Oportunitatea se păstrează la nivel companie-serviciu. Un singur eveniment poate fi relevant pentru două servicii, dar nu este contabilizat de mai multe ori în același grup de reguli doar pentru că apare în documente diferite.


### Integrarea materialelor noi

Triajul opțional Jev poate propune relevanța fragmentului și etichete de serviciu. Un fragment poate susține mai multe servicii; incertitudinea merge spre verificare. Documentul și dovada se păstrează înainte de filtrare, iar un eșantion din fragmentele respinse este reevaluat. Capitolul 21 definește experimentul.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Relevanță 25%; Inovație 20%.

**Întrebare:** Clasificarea înțelege sensul și susține eticheta cu text?

**Dovadă în demo:** Set etichetat cu semnale pozitive, negații, ambiguități și servicii multiple.

**Acceptare / măsurare:** Raportați precision/recall pe clasă și rata necunoscut; fiecare semnal are dovadă.

<!-- PAGEBREAK -->

## 6. Modelul de scoring pe companie și serviciu

Scorul este **o prioritate de cercetare/contactare între 0 și 100**, nu procent de probabilitate de cumpărare. Formula și pragurile de mai jos sunt o configurație inițială de test, de validat cu Orange Systems.

### Componente independente

**F - potrivirea ICP:** suma ponderilor criteriilor înmulțite cu gradul de potrivire, între 0 și 1. Ponderile însumează 100. Exemplu: piață 20, industrie 30, dimensiune 30, venit 20. Criteriile necunoscute nu aduc puncte confirmate; afișăm separat acoperirea K și intervalul posibil F până la completarea datelor.

**R - semnale de actualitate și nevoie:** pentru fiecare regulă i alegem cea mai puternică dovadă eligibilă, după deduplicare. Contribuția este wi × qi × di. Ponderile pozitive însumează 100; q este un coeficient operațional de calitate/relevanță între 0 și 1, nu o probabilitate calibrată. El rezultă din rubrica sursei, explicitatea afirmației și validarea identității, nu doar din încrederea declarată de LLM.

**d - actualitate:** d = 2 la puterea (-vârstă/H), unde H este timpul de înjumătățire configurat pentru acel tip de eveniment. Folosim data evenimentului, nu data unei republicări. Dacă data lipsește, aplicăm o regulă explicită de incertitudine, de exemplu d = 0,5, și marcăm cazul pentru verificare. Joburile închise nu susțin o regulă despre recrutare activă.

**N - penalizări explicite:** sumă plafonată la 30 de puncte, numai pentru reguli negative configurate și dovezi valide. **P = limitare la 0-100 a (0,35 × F + 0,65 × R - N).** Reguli corelate au grup comun și plafon pentru a evita dublarea aceleiași dovezi.

### Acoperirea și blocajele nu sunt ascunse în scor

K este proporția ponderată a criteriilor ICP cunoscute. C este proporția ponderată a întrebărilor de semnal rezolvate în domeniul cercetării declarat. Necunoscut și contradictoriu nu cresc acoperirea. Scorul calculabil din puține date este etichetat „provizoriu”. Numitorii rămân fixați de configurație; nu normalizăm doar pe dovezile găsite.

Un criteriu obligatoriu confirmat ca neîndeplinit produce „neeligibil”. Un criteriu obligatoriu necunoscut sau o identitate ambiguă produce „verificare necesară”. Aceste stări au prioritate față de număr. Dacă P ≥ 70, K ≥ 80%, C ≥ 70% și nu există blocaje, contul poate intra în „de analizat pentru contact”; acceptarea rămâne umană. Un scor mic pe date incomplete nu înseamnă lipsa nevoii.


### Integrarea materialelor noi

Din materialul de segmentare preluăm separarea conceptuală Fit, Intent, Relationship, Engagement. Modelul nostru păstrează F pentru potrivire și R pentru disponibilitatea indicată de semnale; litera R nu înseamnă aici Relationship. Relația și implicarea se afișează separat și adaptează acțiunea. Nu adăugăm încă un scor FIRE peste P și nu numărăm același eveniment de două ori. O știre publică este un indiciu, nu dovada cercetării private a cumpărătorului.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Configurabilitate 20%; Relevanță 25%.

**Întrebare:** Este scorul reproductibil și separă necunoscut de negativ?

**Dovadă în demo:** Recalculați manual un cont; arătați ponderi, decay, penalizări și blocaje.

**Acceptare / măsurare:** Rezultat identic în backend/UI/MCP la aceleași date și aceeași versiune.

<!-- PAGEBREAK -->

## 7. Exemplu calculat și diferențiere între produse

**Exemplu integral fictiv, destinat verificării formulei.** Compania Demo Industrial are F = 90, K = 100% și trei întrebări rezolvate pentru serviciul de securitate analizat. Valorile q și d sunt ipoteze introduse pentru a ilustra calculul; nu descriu o companie reală.

| Regulă pozitivă | Pondere × calitate × actualitate | Contribuție R |
| --- | --- | --- |
| Proiect explicit de modernizare a securității | 40 × 0,9 × 0,5 | 18,0 |
| Recrutare relevantă confirmată | 35 × 0,8 × 0,8 | 22,4 |
| Prioritate de securitate în strategia publicată | 25 × 0,8 × 1,0 | 20,0 |

**R = 60,4; N = 0; P = 0,35 × 90 + 0,65 × 60,4 = 70,76**, afișat 71/100. În acest exemplu, evenimentele și regulile sunt independente; altfel ar interveni plafonul de grup. Detaliul scorului arată valorile nerotunjite și versiunea formulei.

### Același cont nu are același scor pentru toate serviciile

| Serviciu demonstrativ | F / R / N | Prioritate și interpretare |
| --- | --- | --- |
| Securitate | 90 / 60,4 / 0 | 71; merită verificată oportunitatea, dacă acoperirea și identitatea sunt suficiente. |
| Cloud | 90 / 25 / 0 | 48; dovezi mai slabe pentru acest serviciu. |
| Automatizare | 90 / 10 / 0 | 38; cercetare suplimentară înaintea unei recomandări. |

Pentru simplificarea exemplului, F este identic. În produs, fiecare serviciu poate avea alt ICP. Acoperirea C se calculează separat; nu deducem din tabel că toate serviciile au fost cercetate complet. Lipsa facturilor pentru un produs nu demonstrează că firma nu îl utilizează.

### De ce s-a schimbat scorul

Dacă recrutarea confirmată se închide, contribuția sa pentru regula „recrutare activă” devine zero. R scade de la 60,4 la 38,0, iar P devine 56,2. Istoricul arată „anunț închis”, evenimentul și data; nu înlocuiește explicația cu „AI a reevaluat”. Modificarea ponderilor creează o versiune nouă, cu simulare înainte de publicare.

### Verificări obligatorii

Duplicarea unei știri nu schimbă P; lipsa unei date produce statut vizibil; infirmarea unei condiții obligatorii blochează eligibilitatea; două servicii pot avea clasamente diferite; UI, API și MCP returnează aceeași versiune și același rezultat. Sumele contribuțiilor trebuie să reconstruiască exact scorul înainte de rotunjire.


### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Relevanță 25%; UX 15%.

**Întrebare:** Poate vânzătorul explica diferența dintre două scoruri?

**Dovadă în demo:** Rulați exemplul F=90, R=60,4, N=0 și schimbați serviciul.

**Acceptare / măsurare:** P=70,76, afișat 71; fiecare variație este atribuită unei reguli.

<!-- PAGEBREAK -->

## 8. Licitații de la notificare la decizia de participare

Licitațiile reprezintă un flux distinct. Un anunț poate fi o intenție preliminară, o procedură activă, o rectificare, o anulare sau o atribuire. Nici publicarea și nici un termen scurt nu justifică automat punctaj maxim.

### Colectare și verificare

Pornim dintr-un API oficial sau din notificări primite într-o căsuță dedicată, autorizată de utilizator. Pentru MVP acceptăm și import .eml/PDF, etichetat clar. Sistemul extrage linkul, ID-ul procedurii, beneficiarul, lotul, tipul anunțului și termenele; apoi verifică documentul oficial și ultima versiune disponibilă.

[TED Search API](https://docs.ted.europa.eu/api/latest/search.html) oferă căutarea anunțurilor publicate. Pentru România verificăm portalul [SEAP](https://e-licitatie.ro/pub), iar pentru Moldova [MTender](https://mtender.gov.md/) și accesul său public la date. Achizitii.md este o platformă din ecosistem, nu sinonim pentru întregul sistem MTender. Nu presupunem un API funcțional pentru fiecare sursă înainte de testare.

Pentru ingestia e-mail putem folosi Inbound Parse, cu verificarea autenticității webhook-ului, deduplicarea Message-ID și limite pentru atașamente. [Documentație SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/securing-your-parse-webhooks). Conectarea căsuței nu autorizează trimiterea de e-mailuri.

### Dosarul pe lot

Dosarul conține beneficiar și identitate, cerințe tehnice, coduri CPV, valoare estimată și monedă, sursa finanțării dacă este declarată, criterii obligatorii, documente și deadline cu fus orar. Codul CPV ajută filtrarea; nu înlocuiește lectura cerințelor. Rectificările și anulările actualizează aceeași procedură, păstrând istoricul.

Presales marchează cerințele „îndeplinit”, „neîndeplinit” sau „neconfirmat”. O condiție obligatorie neîndeplinită blochează recomandarea de participare; una necunoscută trimite la verificare. Câștigătorii anteriori se includ numai cu sursa atribuirii și perioada; nu presupunem că sunt participanți actuali.

### Prioritate distinctă pentru licitații

Pentru loturile verificate propunem T = 0,50 × potrivire tehnică + 0,30 × atractivitate comercială + 0,20 × fezabilitatea pregătirii, fiecare 0-100. Termenul limită este afișat separat, cu timpul de pregătire necesar; prea puțin timp poate reduce fezabilitatea. Dacă o componentă este necunoscută, T este provizoriu și cazul nu trece direct la „participăm”. T nu se compară numeric cu P din prospectarea directă.


### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Relevanță 25%; Execuție 10%.

**Întrebare:** Separă sistemul atractivitatea licitației de eligibilitate?

**Dovadă în demo:** Anunț pe lot, o condiție necunoscută și o rectificare sau anulare.

**Acceptare / măsurare:** Termenul și versiunea sunt verificabile; necunoscut nu devine eligibil.

<!-- PAGEBREAK -->

## 9. Contextul intern recomandă acțiunea potrivită

CRM-ul arată responsabilul, conversațiile și oportunitățile. Contabilitatea poate confirma o relație comercială și servicii facturate, atunci când descrierile permit. Datele interne provin exclusiv din sistemele autorizate ale organizației utilizatoare, nu din registrele private ale prospectului.

| Situație confirmată | Acțiune propusă |
| --- | --- |
| Client existent, serviciu complementar posibil | Discuție de extindere cu responsabilul contului. |
| Oportunitate activă pentru același serviciu | Atașarea noii dovezi și actualizarea sarcinii, fără duplicare. |
| Factură cu text generic „servicii IT” | Relație comercială confirmată; produs cumpărat rămâne necunoscut. |
| Nicio potrivire sigură | Cercetare sau verificare manuală; nu marcăm automat „client nou”. |
| Termen de contract confirmat | Sarcină de reînnoire potrivită datei; data unei facturi nu ține loc de termen contractual. |

### Maparea produselor facturate

Preferăm codurile SKU și mapările aprobate către catalogul de servicii. Descrierile detaliate pot produce o sugestie, verificată înainte de utilizare. Formulările generice nu sunt forțate într-o categorie. Afirmația „nu cumpără MDR” necesită date suficient de complete; absența unui rând într-un export parțial nu este dovadă.

Contextul intern nu adaugă automat puncte la „nevoie”. El stabilește responsabilul și traseul comercial. Oportunitatea activă nu face firma mai dispusă să cumpere doar pentru că apare în CRM. Regulile de prioritate comercială pot folosi acest context separat, cu explicație.

### Două trasee de lucru

**Vânzare directă:** descoperit → cercetat → de verificat → acceptat pentru contact → discuție → oportunitate → câștigat/pierdut. Un cont cercetat automat nu este denumit lead calificat până când criteriile comerciale nu au fost validate.

**Licitație:** detectată → triată → eligibilitate verificată → decizie participăm/nu participăm → pregătire ofertă → depusă → rezultat. Automatizarea nu depune oferte și nu garantează respectarea procedurii; responsabilul verifică documentația și canalele oficiale.

Respingerea solicită un motiv scurt; acceptarea poate avea comentariu opțional. Capturăm evenimentul, utilizatorul, versiunea scorului și motivul. În MVP, feedback-ul nu modifică automat ponderile după un singur caz. Propunerile de ajustare sunt testate pe un lot separat și publicate de administrator.


### Integrarea materialelor noi

Existența unei facturi, a unui client sau a unei oportunități se verifică prin API/SQL și identificatori confirmați. Un model AI poate sugera maparea unei descrieri contabile ambigue la un serviciu, dar nu decide existența tranzacției. Lipsa răspunsului sau a drepturilor de acces produce starea necunoscut, nu nu.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Impact 10%; Execuție 10%.

**Întrebare:** Contextul intern schimbă corect acțiunea comercială?

**Dovadă în demo:** Comparați prospect nou, client existent și factură cu descriere ambiguă.

**Acceptare / măsurare:** Routing către responsabilul corect; maparea incertă nu inventează un produs cumpărat.

<!-- PAGEBREAK -->

## 10. Brief comercial drafturi și MCP

### Recomandare bazată pe dovezi

Un brief util include situația observată, serviciul posibil relevant, sursele, incertitudinile și o întrebare de validare. Modelul primește numai fapte aprobate, catalogul comercial și contextul permis. Nu inventează implementări anterioare Orange, clienți de referință, roluri de contact sau promisiuni de rezultat.

Exemplu fictiv de draft: „În anunțul dumneavoastră despre modernizarea infrastructurii am observat prioritatea acordată securității. Ar fi utilă o discuție pentru a înțelege ce componente evaluați și dacă există nevoi de suport extern?” Linkul sursei și justificarea apar intern. Mesajul nu afirmă că firma are vulnerabilități doar pentru că recrutează personal de securitate.

Pentru licitații generăm un dosar presales: lot, cerințe, mapare la ofertă, lipsuri, responsabil și calendar. Propunerea de clarificări folosește canalul indicat în documentație; nu transformăm automat un tender într-un e-mail de vânzare către beneficiar.

### Un singur serviciu de evaluare

Dashboard-ul, API-ul și MCP citesc aceeași evaluare stocată: company_id, product_id, score_version, evaluated_at, F, R, N, P, K, C, blocaje și evidence_ids. Rezultatul include o listă de contribuții și o explicație construită din acestea. Un asistent nu recalculează liber scorul din text.

| Operație MCP propusă | Conținut și limită |
| --- | --- |
| search_opportunities | Filtre pe produs, piață, prioritate și stare; paginare și momentul actualizării. |
| explain_product_score | Componente, reguli, surse, acoperire și versiune pentru compania și serviciul cerute. |
| get_tender_brief | Documentația și evaluarea lotului, cu necunoscute și deadline verificat. Etapă ulterioară. |
| propose_crm_action | Previzualizare cu responsabil, obiect destinație și dovada; nu execută. |

În demo prioritizăm primele două operații numai după ce extracția și scoring-ul funcționează. Scrierea în CRM trece printr-o previzualizare și confirmare în interfață. Identificatorul de idempotență previne dublarea după retry; revocarea accesului și conflictele sunt verificate pe server.

MCP transportă contextul și operațiile, nu este un criteriu de potrivire comercială. Conectorii MCP pot avea indicatori de sănătate precum latență sau rata erorilor, dar aceștia nu se combină cu scorul de cumpărare. [SDK oficial](https://github.com/modelcontextprotocol/typescript-sdk).


### Integrarea materialelor noi

Brief-ul include rolurile relevante din grupul de cumpărare: sponsor de business, evaluator tehnic, responsabil de buget și achiziții. Rolurile recomandate sunt ipoteze până la confirmare; nu inventăm persoane, adrese de email sau intenții individuale din semnale la nivel de companie.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** UX 15%; Inovație 20%.

**Întrebare:** Este recomandarea utilizabilă și coerentă între canale?

**Dovadă în demo:** Deschideți același brief în dashboard și prin MCP; previzualizați draftul.

**Acceptare / măsurare:** Aceleași surse și versiune; orice afirmație din draft se poate verifica.

<!-- PAGEBREAK -->

## 11. Dashboard un spațiu de decizie

Pagina de intrare este **„Prioritățile mele”**, nu o colecție de grafice. Utilizatorul trebuie să înțeleagă cine merită analizat, pentru ce serviciu, de ce acum și ce informație lipsește. Planul detaliat al ecranelor este livrat separat.

### Structura de navigare

| Zonă | Rol în flux |
| --- | --- |
| Priorități | Listă pe serviciu, filtre și explicație rapidă. |
| Companii | Profil, scoruri pe produse, cronologia dovezilor și relația internă. |
| Licitații | Loturi, termene, eligibilitate și decizie de participare. |
| Produse și reguli | ICP, întrebări, ponderi, simulare și publicarea unei versiuni. |
| Cercetare și surse | Joburi, acoperire, documente blocate și reluare controlată. |
| Integrări și rezultate | Conexiuni, sincronizare și evaluarea recomandărilor. |

### Lista de priorități

Filtre persistente: serviciu, țară, industrie, proprietar, stadiu, prioritate și acoperire. Un selector de serviciu este obligatoriu înainte de ordonarea pe scor; nu amestecăm scoruri din modele diferite într-un clasament pretins comparabil.

Coloane implicite: companie, serviciu, prioritate, motiv recent, acoperire, responsabil/stare. Câmpurile suplimentare sunt opționale. Click pe rând deschide un panou de detalii fără pierderea filtrelor și poziției. Click pe scor deschide contribuțiile; citatul duce la sursă.

### Practici preluate și adaptate

Din Common Room preluăm separarea potrivirii și comportamentului și explicația factorilor scorului. Din Apollo preluăm filtrele și căutările salvate cu actualizare. Din Clay preluăm configurarea monitorizării și legătura dintre semnal și cercetare. Acestea sunt practici documentate ale produselor, nu dovezi că un anumit aranjament vizual garantează conversii mai mari.

Surse: [Common Room Scores](https://www.commonroom.io/docs/set-preferences/scores/), [Apollo căutări salvate](https://knowledge.apollo.io/hc/en-us/articles/4409803718669-Save-Share-and-Set-Alerts-for-Searches), [Clay Custom Signals](https://university.clay.com/docs/custom-signals).

Nu afișăm „timp economisit” calculat fictiv în timp real. Numărul de dovezi cu citat valid este separat de numărul de dovezi revizuite uman. Indicatorii arată perioada și numitorul, iar lipsa măsurătorii apare ca „nemăsurat”.


### Integrarea materialelor noi

Adăugăm segmente salvate pentru serviciu și relație, cu numărul conturilor și data ultimei actualizări. Coloane distincte: potrivire, prioritate, acoperirea dovezilor, relație CRM și acțiune. Apartenența la segment are un motiv inspectabil; un filtru nu modifică pe ascuns scorul.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** UX 15%; Configurabilitate 20%.

**Întrebare:** Poate un utilizator identifica rapid ce merită analizat?

**Dovadă în demo:** Sarcină: selectați serviciul, filtrați segmentul și deschideți dovada principală.

**Acceptare / măsurare:** Țintă de test propusă: maximum 60 secunde, fără ajutor; raportați rezultatul real.

<!-- PAGEBREAK -->

## 12. Ecrane pentru dovezi reguli și licitații

### Profilul companiei

În partea superioară: nume legal, țară, identitate confirmată sau ambiguă, responsabil și ultima actualizare. Urmează scorurile pe servicii, cu acoperire și statut provizoriu unde este cazul. Scorul deschide formula și lista contribuțiilor.

Taburile sunt Rezumat, Dovezi, Servicii, Relație comercială și Istoric. O dovadă arată citatul, documentul, pagina dacă există, data evenimentului, data colectării și distincția fapt/ipoteză. Mai multe copii ale unui eveniment sunt grupate. „Nu mai este valid” și „companie greșită” sunt acțiuni de feedback accesibile.

### Editorul de reguli

Administratorul modifică ICP-ul, întrebarea, tipul dovezii, ponderea și regula de actualitate. Interfața explică diferența dintre excludere obligatorie și penalizare. „Simulează” arată clasamentul înainte/după pe același eșantion și motivele modificărilor. „Publică versiunea” este distinct de salvarea draftului și permite revenirea la configurația anterioară.

### Dosarul licitației

Header: beneficiar, procedură/lot, stare, deadline și fus orar. Coloana centrală conține matricea cerință-dovadă-capacitate-lipsă; un panou lateral arată responsabilul și acțiunea. Statusurile „termen depășit”, „anulat” și „rectificat” au prioritate vizuală față de scor. Butoanele sunt „Solicită verificare”, „Propune participarea” și „Nu participăm”, nu aprobări automate.

### Stări obligatorii și accesibilitate

Lista distinge încărcare, cercetare în curs, zero rezultate, sursă indisponibilă, date incomplete, eroare de sincronizare și acces insuficient. Dacă există date anterioare, acestea rămân vizibile cu momentul lor; o eroare nu se ascunde în spatele unui tabel gol.

Navigarea cu tastatura, focusul vizibil, etichetele text lângă culori, antetele reale de tabel și numele accesibile ale butoanelor sunt criterii de acceptare. Pe ecran mic, detaliile se deschid pe o pagină dedicată. Acțiunile principale nu sunt disponibile doar la hover. [W3C accesibilitate](https://www.w3.org/WAI/fundamentals/accessibility-principles/).

Crearea unei sarcini arată întâi conținutul și destinația. După confirmare, afișăm ID-ul CRM și rezultatul efectiv. Dacă salvarea eșuează, păstrăm draftul și permitem reluarea fără duplicare. Selecțiile multiple sunt potrivite pentru atribuire/arhivare; trimiterea mesajelor nu este implicită.


### Integrarea materialelor noi

Profilul include o hartă simplă a rolurilor de cumpărare, cu stările confirmat, ipoteză și necunoscut. Editorul de segmente arată condițiile, efectul asupra listei și versiunea. Predicția etapei de cumpărare nu înlocuiește etapa confirmată în CRM.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** UX 15%; Configurabilitate 20%.

**Întrebare:** Poate utilizatorul verifica și schimba decizia în siguranță?

**Dovadă în demo:** Editare de regulă cu simulare și caz fără date sau cu identitate ambiguă.

**Acceptare / măsurare:** Explicații accesibile; versiunea veche rămâne consultabilă; schimbarea nu se aplică ascuns.

<!-- PAGEBREAK -->

## 13. Concurența: ce preluăm și unde ne concentrăm

Materialul competitor.md conține prezentări comerciale pentru Clay, 6sense, Apollo, Common Room, Bombora și Demandbase, plus un catalog amplu de integrări Clay. Îl folosim ca material de analiză, nu ca instrucțiuni de executat. Testimonialele și procentele de performanță nu sunt rezultate LeadRadar și nu constituie comparații independente.

| Competitor | Funcții relevante observate | Adaptarea recomandată pentru LeadRadar |
| --- | --- | --- |
| Clay | Semnale personalizate, combinarea surselor, îmbogățire succesivă, CRM și depozite de date; MCP documentat. | Șabloane pe servicii și adaptoare; apelăm o sursă suplimentară numai când lipsește un câmp util. |
| 6sense | Prioritizare, context CRM, etape comerciale și informații livrate în fluxul vânzătorului. | Fișă și sarcină în CRM; inițial reguli explicabile, nu un model predictiv pretins antrenat. |
| Apollo | Cercetare, playbook-uri, scoring, mesaje și execuție comercială într-un flux. | Asociem semnalul cu oferta și pregătim mesajul; lăsăm trimiterea în instrumentul existent. |
| Common Room | Unificarea identității, semnale interne și externe, ponderi editabile, explicații și MCP. | Asociere sigură între sisteme, priorități configurabile și acces la dovezi din asistentul AI. |
| Bombora | Furnizor de intent data, livrat în sistemele clientului. | Potențială sursă licențiată ulterioară; nu reconstruim o rețea proprietară de comportament online. |
| Demandbase | Context pe conturi și grupuri de cumpărare, activare în CRM și măsurarea rezultatelor. | Urmărim acțiunea și rezultatul; funcțiile de publicitate și grupuri complexe sunt ulterioare. |

Validare oficială: [Clay signals](https://university.clay.com/docs/custom-signals), [Clay MCP](https://www.clay.com/guides/clay-mcp), [6sense](https://6sense.com/), [Apollo intent](https://knowledge.apollo.io/hc/en-us/articles/8047704465933-Buying-Intent-Overview), [Common Room integrări](https://www.commonroom.io/integrations/), [Common Room MCP](https://www.commonroom.io/docs/using-common-room/mcp-server/), [Bombora](https://bombora.com/intent/), [Demandbase](https://www.demandbase.com/products/account-intelligence/intent/).

### Concluzia competitivă

CRM, baze de date, MCP, AI și scoring explicabil nu sunt individual avantaje unice. Nu avem dovezi că toți concurenții ar fi incapabili să includă date contabile prin extensii. Ipoteza noastră este că un flux gata configurat pentru servicii IT, cu context comercial și contabil, poate necesita mai puțin efort și poate produce recomandări mai utile pentru acest segment.

O comparație corectă măsoară aceeași sarcină în LeadRadar, într-o configurație Clay sau Common Room și în procesul manual: timp de configurare, asocierea corectă a firmei, relevanța recomandării și timpul până la o acțiune acceptată. Funcțiile comerciale descrise aici inspiră cerințe; codul și datele proprietare nu sunt reutilizate fără drepturi.


### Integrarea materialelor noi

Materialul segmen3t.md extinde analiza Bombora cu segmentare, îmbogățire, buying groups și separarea fit/intent/relație/engagement. LeadRadar adaptează aceste principii de produs, fără a pretinde acces la rețeaua de date comportamentale a furnizorului. Orice integrare cu astfel de date presupune acces și condiții comerciale confirmate.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Impact 10%; Inovație 20%.

**Întrebare:** Diferențierea este relevantă și demonstrată?

**Dovadă în demo:** Aceeași sarcină comparată cu procesul manual și o configurație concurentă.

**Acceptare / măsurare:** Separați funcții documentate, testate și planificate; nu afirmați unicitate fără dovadă.

<!-- PAGEBREAK -->

## 14. Tehnologii reutilizabile și decizii de construcție

Nu putem deduce tehnologiile interne ale concurenților din textele lor comerciale. Tabelul propune instrumente publice cu care putem implementa rapid funcții comparabile, fără a pretinde că reprezintă stack-ul competitorilor.

| Componentă | Alegere propusă | Ce construim noi |
| --- | --- | --- |
| Interfață și API | TypeScript, React/Next.js. | Configurare pe servicii, conturi, dovezi și previzualizarea acțiunilor. |
| Date și procesare | PostgreSQL; pg-boss pentru sarcini de fundal. | Model comun, proveniență, scoring, deduplicare și reconciliere. |
| Colectare web | Firecrawl prin serviciul găzduit; Playwright doar unde este necesar și permis. | Alegerea surselor și validarea asocierii document-companie. |
| Extragere AI | Un furnizor LLM cu răspuns structurat; validare a schemei în cod. | Întrebări, dovezi, tratarea contradicțiilor și evaluare pe cazuri etichetate. |
| Conectoare | API direct pentru primul CRM; Nango evaluat pentru autorizare și sincronizări ulterioare. | Maparea obiectelor, operațiile acceptate și rezolvarea conflictelor. |
| MCP | SDK oficial TypeScript. | Instrumente limitate, reguli de acces și același model de dovezi ca în UI. |

Proiecte reutilizabile: [Next.js](https://github.com/vercel/next.js), [pg-boss](https://github.com/timgit/pg-boss), [Playwright](https://github.com/microsoft/playwright), [Firecrawl](https://github.com/firecrawl/firecrawl), [Nango](https://github.com/NangoHQ/nango), [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

### Cumpărăm infrastructura comună, construim logica distinctivă

Nango este candidat pentru gestionarea conexiunilor și funcții de sincronizare în TypeScript. Suportul pentru autentificarea unui furnizor nu înseamnă automat că toate obiectele contabile sau CRM cerute sunt deja implementate. Verificăm fiecare operație, planul comercial și licența versiunii alese. [Catalog Nango](https://nango.dev/api-integrations).

n8n poate accelera un flux intern sau un pilot, dar nu îl presupunem gratuit pentru includere într-un SaaS care folosește acreditările clienților. Modelul de utilizare trebuie verificat înainte de adoptare. [Licența n8n](https://docs.n8n.io/sustainable-use-license/). Firecrawl găzduit și codul pentru self-hosting au condiții distincte; nu presupunem că publicarea pe GitHub permite orice reutilizare comercială.

### Contract minim pentru orice conector

Conectorul declară autentificarea, obiectele și câmpurile suportate, direcția transferului, cotele și strategia de reluare. Are jurnal fără secrete, stare vizibilă, test de revocare și teste pentru duplicate și erori. Un adaptor generic HTTP sau MCP accelerează transportul; nu elimină munca de mapare a sensului datelor.

Pentru prima versiune păstrăm o singură bază de date și un singur mecanism de joburi. Bibliotecile și serviciile se fixează la versiuni verificate la începutul implementării. Nu instalăm toate opțiunile din tabel doar pentru a crește numărul de tehnologii din prezentare.


### Integrarea materialelor noi

Jev este un adaptor opțional de clasificare, cu experiment comparativ în capitolul 21. Scoringul, look-up-urile contabile și controlul accesului rămân în cod. În spațiul local, Firecrawl CLI și SDK au trecut câte o verificare live, iar MCP este autentificat; acest lucru validează accesul de ingestie, nu existența întregului produs.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Execuție 10%; Inovație 20%.

**Întrebare:** Arhitectura funcționează și permite înlocuirea furnizorului?

**Dovadă în demo:** O sursă live, un job nereușit reluat și schimbarea adaptorului de triaj.

**Acceptare / măsurare:** Păstrarea dovezilor, limitelor de cost și contractului de date la fiecare variantă.

<!-- PAGEBREAK -->

## 15. Piața: oportunitate mare, segment inițial precis

„Semnale B2B” descrie o capacitate care apare în mai multe categorii: sales intelligence, intent data și platforme de vânzări și marketing. Sursele consultate nu oferă o măsurare separată, comparabilă, pentru exact nișa LeadRadar: semnale publice configurabile pentru vânzarea serviciilor IT.

Categoria sales intelligence oferă un reper de context. **Nu reprezintă automat piața accesibilă produsului.**

### Estimări externe pentru categoria globală

| Sursă | Estimare pentru 2025 | Prognoză publicată |
| --- | --- | --- |
| Grand View Research | 4,0 miliarde USD | 8,7 miliarde USD în 2033; CAGR de 10,1% pentru 2026-2033. |
| Fortune Business Insights | 4,85 miliarde USD | 12,45 miliarde USD în 2034; CAGR de 11,10% pentru 2026-2034. |

Surse: [Grand View Research - Sales Intelligence Market](https://www.grandviewresearch.com/industry-analysis/sales-intelligence-market), [Fortune Business Insights - Sales Intelligence Market](https://www.fortunebusinessinsights.com/sales-intelligence-market-109103). Consultate la 25 septembrie 2026. Valorile sunt estimările editorilor, iar cele viitoare sunt prognoze. Diferența dintre estimări reflectă metodologii și delimitări diferite; nu este un interval statistic de încredere.

### TAM, SAM și SOM fără a exagera oportunitatea

**TAM de categorie:** estimările de mai sus arată dimensiunea pieței înrudite. TAM-ul exact pentru nișa LeadRadar rămâne de stabilit prin definirea cumpărătorilor și validarea disponibilității de plată.

**SAM inițial, construit de jos în sus:** furnizori IT europeni care vând servicii complexe, au cercetare comercială recurentă și pot cumpăra un abonament. Următoarele valori sunt scenarii de planificare, nu un recensământ al pieței:

| Scenariu | Organizații eligibile × abonament anual | Valoare anuală ipotetică |
| --- | --- | --- |
| Restrâns | 500 × 6.000 EUR | 3 milioane EUR |
| De bază | 1.000 × 12.000 EUR | 12 milioane EUR |
| Extins | 2.000 × 18.000 EUR | 36 milioane EUR |

**SOM ca obiectiv operațional:** 20 de clienți activi la 12.000 EUR/an ar însemna 240.000 EUR venit anual recurent la sfârșitul unei perioade de 24 de luni. Acesta este un obiectiv condițional, nu o prognoză validată și nici venitul cumulat în cei doi ani.

Validarea cere o listă deduplicată de cumpărători eligibili, interviuri și teste de preț. Moneda USD a cercetării externe și scenariile în EUR sunt păstrate separat, fără conversii presupuse.


### Integrarea materialelor noi

Sursa segmen3t.md susține o metodă de segmentare, nu o estimare nouă a pieței. SAM-ul trebuie numărat după firmele care cumpără platforma: furnizori IT cu proces comercial și buget compatibile. Numărul companiilor monitorizate de acești clienți este volum operațional, nu număr de clienți SaaS.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Impact și scalabilitate 10%.

**Întrebare:** Dimensiunea pieței este argumentată fără dublă numărare?

**Dovadă în demo:** Explicați separat categoria globală, SAM de jos în sus și obiectivul SOM.

**Acceptare / măsurare:** Fiecare cifră are sursă sau etichetă de ipoteză; clienții SaaS nu sunt conturile monitorizate.

<!-- PAGEBREAK -->

## 16. Model comercial și intrare pe piață

Primul segment recomandat este format din furnizori de servicii IT cu mai multe oferte și o echipă care cercetează regulat conturi B2B. Alegerea pornește de la problema Orange Systems și permite folosirea unor șabloane comerciale repetabile: automatizare, securitate cibernetică și cloud.

### De la proiect demonstrativ la produs

Prima ofertă ar fi un pilot limitat la o piață, unul sau două servicii și un set agreat de companii. Partenerul pilot ar furniza criteriile comerciale și feedback-ul; echipa LeadRadar ar livra dovezi, prioritizare și măsurarea timpului de cercetare. Participarea la provocare nu reprezintă un acord comercial sau un parteneriat confirmat cu Orange.

Conectorii standard pot intra în abonament, iar integrările personalizate pot avea cost de configurare și suport separat. Nu promitem acces nelimitat la toate sistemele: fiecare conector are obiecte, operații și limite documentate.

După validare, același model poate fi propus integratorilor, furnizorilor de servicii administrate și consultanțelor IT care vând servicii comparabile. Extinderea către alte industrii de vânzători ar urma numai după demonstrarea unui proces de configurare repetabil.

### Ipoteză de monetizare

Abonament lunar per organizație, cu limite transparente pentru companii monitorizate, frecvența actualizărilor și consumul de cercetare. Un interval inițial de testare de **500-1.500 EUR/lună**, cu o ipoteză centrală de 1.000 EUR/lună, poate fi discutat în interviuri. Aceste valori sunt propuneri, nu prețuri validate sau comparații cu ofertele concurenților.

Un cost separat de configurare ar avea sens numai dacă există muncă reală de adaptare și cumpărătorul o consideră valoroasă. Pentru un pilot scurt, obiectivul principal este demonstrarea utilității, nu maximizarea complexității comerciale.

### Ce trebuie să susțină economia produsului

| Factor | Decizie de produs și măsurare |
| --- | --- |
| Costuri de cercetare | Măsurăm costul per companie actualizată și per semnal acceptat; reutilizăm documentele deja procesate. |
| Costuri de integrare | MVP cu un CRM; urmărim orele de configurare și costul de mentenanță per conector înainte de extindere. |
| Suport și configurare | Urmărim timpul până la prima listă utilă și cât poate configura clientul independent. |
| Retenție | Măsurăm folosirea recurentă și deciziile susținute, apoi disponibilitatea de reînnoire. |

Nu există în acest document suficiente date pentru a afirma costul de achiziție a unui client, valoarea pe durata relației sau marja brută. Ele trebuie calculate după observarea consumului, a suportului și a procesului comercial real. Avantajul economic va depinde de calitatea prioritizării, nu de cantitatea de pagini colectate.


### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Impact și scalabilitate 10%.

**Întrebare:** Există o cale realistă de la pilot la abonament?

**Dovadă în demo:** Fișă de pilot cu beneficiar, durată, costuri, indicatori și criteriu de continuare.

**Acceptare / măsurare:** Prețul și ROI sunt ipoteze de validat; costul include date, AI, suport și conectori.

<!-- PAGEBREAK -->

## 17. Diferențierea: integrarea trebuie să schimbe decizia

**Poziționare:** LeadRadar este platforma de semnale B2B pentru furnizori IT care conectează dovezile publice cu relația comercială existentă și le transformă în acțiuni trasabile în CRM și asistenți AI.

Nu concurăm inițial prin cel mai mare catalog de contacte sau cele mai multe conectoare. Prioritatea este un rezultat complet, configurabil și ușor de verificat pentru o echipă care vinde servicii complexe.

| Pilon | Valoare urmărită | Cum îl demonstrăm |
| --- | --- | --- |
| Semnal + serviciu | Același eveniment este evaluat diferit pentru automatizare, securitate sau cloud. | Schimbarea serviciului schimbă explicația și prioritatea, conform regulilor. |
| Context comercial și contabil | Separăm prospectarea nouă de extinderea unei relații existente. | O asociere confirmată cu un client schimbă responsabilul și tipul acțiunii. |
| Dovezi în sistemele existente | Utilizatorul poate acționa din CRM sau dintr-un asistent MCP. | Aceeași versiune de scor și aceleași surse apar pe toate canalele. |
| Conectare controlată | Integrarea nu introduce dubluri sau suprascrieri neclare. | Repetarea evenimentului nu creează o a doua sarcină; jurnalul arată modificarea. |
| Configurare pe servicii | Echipa ajustează întrebările și regulile fără dezvoltare nouă. | Un utilizator configurează și verifică un nou set de semnale. |

### Ce poate deveni avantaj durabil

Valoarea greu de replicat poate veni din biblioteca de servicii și reguli validate, calitatea asocierii între firme și rezultatele măsurate ale recomandărilor. Conectorii întreținuți, cu obiecte și comportamente documentate, pot reduce costul de adoptare. Aceste avantaje trebuie construite și testate; simpla folosire a MCP nu creează o barieră competitivă.

Rezultatele CRM ajută la evaluare. Facturile și încasările pot completa ulterior observarea valorii comerciale, dar nu dovedesc că LeadRadar a cauzat vânzarea. Asocierea cu o recomandare este un indicator de contribuție; impactul incremental cere un grup de comparație și o perioadă adecvată.

Portofoliul Orange România furnizat de echipă poate inspira șabloane. Serviciile efectiv oferite de Orange Systems, piețele prioritare și sistemele interne disponibile trebuie confirmate cu responsabilul pilotului. Datele fiecărui client rămân separate; feedback-ul confidențial nu este presupus reutilizabil pentru alt client.


### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Impact 10%; Configurabilitate 20%.

**Întrebare:** Integrarea produce o decizie mai bună, nu doar un export?

**Dovadă în demo:** Arătați cum aceeași dovadă produce acțiuni diferite în funcție de relația CRM.

**Acceptare / măsurare:** Un retry creează o singură sarcină; sursele și versiunea scorului rămân atașate.

<!-- PAGEBREAK -->

## 18. Echipa: patru roluri pentru un flux complet

Echipa are **doi dezvoltatori backend/AI, un dezvoltator frontend și un product/project manager**, conform structurii confirmate. Împărțirea de mai jos este propusă pentru execuție. Nu presupune biografii, certificări sau proiecte anterioare care nu au fost furnizate.

| Rol | Responsabilitate principală | Livrabil demonstrabil |
| --- | --- | --- |
| Dezvoltator backend/AI 1 | Colectare, conector CRM, import contabil, identificarea companiei și sincronizare. | Documente și evenimente trasabile, asociate companiei corecte. |
| Dezvoltator backend/AI 2 | Extragere, dovezi, scoring, evaluare și server MCP peste API-ul comun. | Semnale explicate și scor recalculabil pe un set de test. |
| Dezvoltator frontend | Configurarea serviciilor și conexiunilor, dovezi și previzualizarea acțiunilor CRM. | Un flux pe care utilizatorul îl poate parcurge fără asistență tehnică. |
| Product/project manager | Definirea cazului comercial, prioritizare, criterii de acceptare, pilot și prezentare. | Un demo coerent și un raport care leagă funcțiile de rezultate măsurabile. |

### De ce suntem potriviți

Problema necesită simultan integrarea surselor, raționament pe text, o interfață clară și înțelegerea procesului de vânzare. Structura echipei acoperă explicit toate cele patru componente. Doi dezvoltatori backend/AI permit împărțirea colectării și interpretării; frontend-ul face rezultatul accesibil, iar PM-ul păstrează legătura cu decizia comercială și criteriile juriului.

O echipă de patru persoane poate scurta coordonarea și menține responsabilități clare. Pentru ca acest avantaj să existe în practică, stabilim de la început schema datelor și un singur flux demonstrativ comun. Integrarea zilnică și verificarea cap-coadă sunt mai importante decât dezvoltarea multor funcții izolate.

### Cum susținem afirmația „cea mai bună alegere”

Nu avem suficiente informații pentru a afirma superioritatea echipei față de toți participanții. Putem însă susține o promisiune precisă: **o echipă care acoperă întregul traseu de la sursa publică la decizia comercială și își verifică rezultatul pe criterii vizibile.**

În prezentare, această promisiune trebuie dovedită prin trei lucruri: o sursă reală care susține un semnal, o regulă schimbată live care explică reordonarea și un utilizator care poate decide următorul pas fără să interpreteze singur documentele brute.

Pentru versiunea nominală a documentului, pot fi adăugate numele și câte un proiect relevant verificabil pentru fiecare membru. Până atunci, credibilitatea se bazează pe responsabilități și livrabile, nu pe experiență presupusă.


### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Execuție 10%; Impact 10%.

**Întrebare:** Acoperă echipa livrarea și validarea întregului flux?

**Dovadă în demo:** Câte un livrabil funcțional pentru fiecare dintre cele patru roluri.

**Acceptare / măsurare:** Responsabil clar pentru integrare, AI, UX și acceptare; experiența nu este inventată.

<!-- PAGEBREAK -->

## 19. Validare și demonstrație realizabilă

### Ce măsurăm de la prima versiune

Păstrăm traseul interogare-document-eveniment-scor-acțiune și feedback-ul utilizatorului. Precizia extracției, asocierea entității, relevanța pe serviciu și utilitatea comercială sunt măsurate separat. Citat prezent nu înseamnă automat interpretare corectă.

| Verificare | Rezultat așteptat |
| --- | --- |
| Știre republicată de cinci ori | Un eveniment și aceeași contribuție la scor. |
| Filială cu domeniu comun grupului | Identitate ambiguă până la confirmare; fără unire contabilă automată. |
| Factură cu descriere generică | Client existent, serviciu necunoscut. |
| Job închis sau eveniment vechi | Recalculare conform regulii, cu motiv vizibil. |
| Tender rectificat sau anulat | Versiunea și starea sunt actualizate; decizia anterioară este reevaluată. |
| Date lipsă sau API blocat | Acoperire redusă și statut vizibil, nu concluzie negativă inventată. |
| Retry pentru scriere CRM | O singură sarcină, ID și jurnal păstrate. |

### Evaluare comercială

În pilot, doi evaluatori folosesc aceeași rubrică pentru un set de firme separat de cel de reglare. Raportăm Precision@20 pe serviciu, cu numărul de cazuri și dezacordurile. Un prag inițial de 80% este o țintă propusă, nu performanță demonstrată. Pentru tendere, evaluăm și extragerea termenelor și a condițiilor obligatorii.

Timpul de cercetare se măsoară cu verificarea umană inclusă, pe sarcini comparabile. Exemplul 25→8 minute rămâne scenariu. Nu preluăm afirmația 2%→15% rată de răspuns din materialul furnizat ca rezultat. Venitul atribuit, venitul facturat și contribuția cauzală sunt indicatori diferiți.

### Demonstrație în cinci minute

Arătăm întrebarea configurată, un document verificabil și clasificarea; deschidem calculul pentru două servicii; introducem un caz de context contabil; pregătim un draft și previzualizăm sarcina CRM. Separat, un anunț de licitație arată termenul și criteriul de eligibilitate neconfirmat. Datele cached, importate sau fictive sunt etichetate.

Prioritatea echipei este traseul complet pe 3-5 cazuri, apoi robustețea, apoi extinderea la 15-20. MCP de citire este adăugat dacă nucleul este stabil. Un catalog mare de conectoare și ML predictiv nu condiționează succesul demo-ului. Juriului îi arătăm ce funcționează și ce rămâne de validat, raportat la criteriile din brief.

### Criterii de evaluare pentru juriu - propunere

**Legătură cu grila:** Toate cele șase criterii.

**Întrebare:** Este demonstrația verificabilă și separată de promisiuni?

**Dovadă în demo:** Demo pe cazuri reale/importate etichetate și raport de evaluare ținut separat de reglaj.

**Acceptare / măsurare:** Țintă propusă Precision@20 ≥80% pe serviciu; prezentați n, erorile și cazurile nerezolvate.

<!-- PAGEBREAK -->

## 20. Segmentare și grupuri de cumpărare

Documentul segmen3t.md reunește materiale Bombora despre segmentare, buying groups, scoring, îmbogățirea datelor și activarea audiențelor. Preluăm principiile și le adaptăm la serviciile IT. Statisticile, testimonialele și rezultatele comerciale ale furnizorului nu devin rezultate LeadRadar.

### De la piață la acțiunea pe cont

| Nivel | Întrebarea rezolvată | Implementare LeadRadar |
| --- | --- | --- |
| Piață / ICP | Ce firme se potrivesc serviciului? | Industrie, dimensiune, țară, tehnologie confirmată, criterii obligatorii. |
| Segment dinamic | Ce firme necesită atenție acum? | Semnale recente, scor pe serviciu, acoperire, relație și excluderi. |
| Grup de cumpărare | Ce roluri trebuie implicate? | Sponsor de business, tehnic, buget, achiziții; persoane numai dacă sunt confirmate. |
| Acțiune | Cine face ce și de ce? | Owner CRM, ipoteză de nevoie, dovadă și pas următor verificabil. |

Segmentele sunt vizualizări ale datelor, cu reguli AND/OR, versiune, autor și moment de recalculare. Un cont poate aparține mai multor segmente; nu multiplicăm oportunitățile pentru fiecare apartenență. Prioritatea rămâne calculată pe companie-serviciu, iar acțiunile duplicate sunt reconciliate.

### Trei exemple de configurare, nu constatări despre firme reale

- **Automatizare:** firmă eligibilă, anunț recent despre eficiență și rol de process excellence. Acțiune: validarea procesului și a volumului, apoi discuție cu operațiuni și IT.
- **Cybersecurity:** firmă eligibilă, inițiativă de securitate confirmată și fără oportunitate duplicată. Acțiune: discuție de descoperire cu responsabilul tehnic; un incident public nu dovedește singur bugetul sau intenția de cumpărare.
- **Extindere client:** relație CRM confirmată și serviciu adiacent relevant. Acțiune: owner-ul contului validează oportunitatea; o factură generică nu confirmă serviciul deja cumpărat.

### Harta grupului de cumpărare și limitele datelor

Pentru automatizare, rolul operațional poate explica blocajul, IT poate verifica integrarea, iar finanțele pot evalua beneficiul. Pentru securitate, rolul tehnic poate valida cerințele, iar achizițiile procesul de ofertare. Acestea sunt ipoteze de rol, nu identificări automate ale persoanelor cu autoritate.

UI afișează pentru fiecare rol sursa, data și starea confirmat/ipoteză/necunoscut. Acoperirea grupului înseamnă roluri confirmate împărțite la roluri considerate necesare în configurație; nu reprezintă probabilitate de vânzare. Nu deducem personalitatea sau intenția unei persoane din funcția sa.

Distingem faptele publice, engagement-ul din sistemele proprii autorizate și intent data furnizat sub licență. Nu afirmăm că o știre oferă acces la comportamentul privat de cercetare observat de furnizori precum Bombora. În MVP, folosim dovezi publice și context CRM; datele comportamentale terțe sunt opționale.

### Criterii de evaluare pentru juriu - propunere

**Grilă:** configurabilitate 20%, relevanță 25%, UX 15%. **Test:** modificați un segment, verificați intrarea/ieșirea unui cont și arătați motivul; apoi deschideți harta rolurilor. **Acceptare:** apartenență reproductibilă, fără persoane inventate și fără dublarea scorului. **Măsurare:** timp de configurare, precision pe segment și proporția rolurilor confirmate, cu numitor explicit.

<!-- PAGEBREAK -->

## 21. Jev: experiment pentru triaj, nu dependență critică

Documentul jev- sec 10.md propune separarea clasificării de generarea explicațiilor. Îl integrăm în arhitectură și în experimentul de mai jos.

TypeSafe descrie Jev ca model de decizii structurate, cu rezultate tipizate și estimări de încredere, fără generare liberă de text. Anunțul de lansare îl prezintă în early access. Aceste proprietăți justifică evaluarea unui adaptor de triaj; nu demonstrează precizia pe semnale B2B românești. Respectarea unei scheme nu garantează un verdict corect. Surse primare consultate: [anunț TypeSafe](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [documentație de pornire](https://docs.typesafe.ai/introduction/quickstart).

### Împărțirea responsabilităților propusă

| Sarcină | Componentă | Motiv și limită |
| --- | --- | --- |
| Industrie, țară, prag numeric confirmat | Cod / reguli ICP | Comparații deterministe pe date validate. |
| Relevanța unui fragment și etichete de servicii | Jev opțional sau clasificator LLM | Interpretare semantică; permite necunoscut și mai multe etichete. |
| Existența facturii / oportunității | SQL / API CRM-contabil | Verificare exactă, fără verdict probabilistic al modelului. |
| Vechimea evenimentului și scorul final | Cod versionat | Data verificată, ponderi, decay, penalizări și gates. |
| Dovezi, interpretarea ambiguităților | Extragere LLM + verificare | Citatul trebuie regăsit în document; contradicțiile se păstrează. |
| Brief și draft comercial | LLM generativ | Generează numai din fapte și contribuții validate. |

### Fluxul cu două niveluri

1. Colectăm și salvăm documentul, hash-ul și metadatele înainte de filtrare.
2. Aplicăm verificări exacte și deduplicare; nu plătim AI pentru look-up-uri simple.
3. Clasificăm fragmentele cu aceeași schemă indiferent de furnizor. Stocăm eticheta, încrederea, modelul, versiunea rubricii și ID-ul sursei.
4. Trimitem rezultatele relevante sau incerte la extragere aprofundată. Păstrăm o coadă de revizuire și un eșantion aleator din respingeri.
5. Calculăm P în cod; generăm explicația pornind de la contribuțiile deja calculate.

Nu adoptăm automat ipoteza că doar 5-15% din fragmente trebuie păstrate. Un filtru ieftin care pierde semnale bune poate reduce valoarea întregului sistem. Nici prețurile și latențele din testele de email citate în document nu sunt benchmark-uri LeadRadar. Nu promitem atingerea țintei de 8 minute datorită Jev.

### Experiment și prag de adoptare

Propunem 300 de fragmente etichetate din știri, cariere și rapoarte: 100 pentru reglaj și 200 pentru test, cu separare pe companie/eveniment pentru a evita scurgerea informației. Setul conține română și engleză, negații, ambiguități, semnale rare și documente cu servicii multiple. Doi evaluatori etichetează independent; dezacordurile sunt adjudecate.

Comparăm reguli, LLM structurat și Jev + fallback: recall, precision pe clasă, latență p50/p95, escaladare și cost total per semnal acceptat. Ținte propuse: recall ≥95% și economie ≥20% față de baseline, fără degradare comercială relevantă. Raportăm numerele de cazuri și incertitudinea; eșantionul nu dovedește generalizarea.

### Criterii de evaluare pentru juriu - propunere

**Grilă:** inovație 20%, relevanță 25%, execuție 10%. **Test:** același lot trece prin baseline și adaptorul candidat; simulăm indisponibilitatea furnizorului. **Acceptare:** costul include fallback-ul, pierderile sunt măsurate, iar schimbarea modelului nu modifică formula P. Jev rămâne opțional până la un benchmark real; acest document nu raportează unul deja efectuat.

<!-- PAGEBREAK -->

## 22. Pregătirea evaluării: patru perspective profesionale

Sursa juriu.md conține extrase de profiluri și activități. Le folosim pentru a anticipa teme profesionale legitime, fără a deduce convingeri, criterii personale sau voturi. Rolurile de mai jos sunt descrierile din materialul furnizat, nu o verificare actualizată a angajării sau a componenței oficiale a juriului. Nu reproducem integral CV-uri, fotografii și interfața LinkedIn.

| Profil din material | Context profesional descris | Întrebare de pregătire propusă |
| --- | --- | --- |
| Vitalii Solomaha | Dezvoltare comercială internațională și parteneriate; servicii IT și automatizare. | De ce merită abordat acest cont acum și care este oferta potrivită? |
| Dmitry Tsepilovan | Operațiuni de securitate, SOC și infrastructură. | Ce dovadă susține semnalul de securitate și cum evităm alertele false? |
| Phillip M. Sparks | AI, guvernanță, risc, securitate și management de proiect. | Cine răspunde de decizie și cum reconstruim traseul de la sursă la acțiune? |
| Victor Bivol | Service delivery, proiecte IT și controlul riscurilor. | Cum funcționează soluția când o sursă sau o integrare eșuează? |

### Dovezi pentru discuția comercială

Pregătim o fișă de cont cu nevoie ipotetică, serviciu, sursă, recență, relație CRM, owner și următor pas. Putem explica diferența dintre semnal, oportunitate calificată și venit. Economia de timp include verificarea umană; nu transformăm scorul într-o promisiune de conversie.

### Dovezi pentru discuția tehnică și de securitate

Pregătim un caz fals pozitiv și unul ambiguu. Arătăm că textul extern este tratat ca date: o pagină care cere ignorarea regulilor nu poate modifica sistemul sau declanșa scrieri CRM. Demonstrarea izolării între clienți, a secretelor păstrate pe server și a accesului limitat cere teste reale înainte de a afirma că aceste controale sunt implementate.

### Dovezi pentru guvernanță și livrare

Pachetul de evaluare include versiunea regulilor și modelului, jurnalul modificărilor, cazurile de abținere, responsabilul validării și logul retry-urilor. O operație CRM repetată nu creează dubluri; un conector indisponibil afișează o stare recuperabilă. Un mod demo cu date salvate este etichetat, nu prezentat ca acces live.

### Cum răspundem când nu știm

Un răspuns bun precizează ce este implementat, ce probă există și ce experiment ar rezolva necunoscuta. Dacă nu avem acces la Jev, o integrare contabilă sau un set de evaluare, prezentăm arhitectura și starea reală. Nu pretindem certificări, conformitate juridică sau validare Orange doar pentru că acestea apar în experiența profesională a evaluatorilor.

### Criterii de evaluare pentru juriu - propunere

**Grilă:** impact 10%, relevanță 25%, execuție 10%. **Test:** patru întrebări, câte una din tabel, fiecare răspuns susținut de un artefact sau un rezultat verificabil. **Acceptare:** echipa recunoaște limitele și poate demonstra responsabilitatea deciziei; niciun criteriu nu depinde de presupuneri personale despre jurați.

<!-- PAGEBREAK -->

## 23. Grila de evaluare și dosarul de demonstrație

Ponderile de mai jos provin din brief-ul transmis de echipă. Întrebările și pragurile din capitole sunt rubrici propuse pentru pregătire; organizatorul poate aplica alte instrucțiuni de notare. Nu adunăm ponderile repetate la fiecare capitol.

| Criteriu din brief | Pondere | Capitole și dovada principală |
| --- | --- | --- |
| Relevanța și acuratețea semnalelor | 25% | 2-9, 19-21: surse, identitate, cazuri negative, precision/recall. |
| Inovație AI/ML | 20% | 5-7, 10, 14, 21: extragere cu dovezi, routing și benchmark al triajului. |
| Configurabilitate | 20% | 2, 6, 11-12, 17, 20: serviciu și segment schimbate fără cod. |
| Utilizabilitate și UX | 15% | 1, 7, 10-12, 20: sarcină efectuată de un utilizator fără asistență. |
| Impact și scalabilitate | 10% | 1, 9, 13, 15-18: timp, economie unitară, pilot și diferențiere. |
| Execuție tehnică | 10% | 3-4, 8-10, 14, 18-19, 21-22: flux funcțional, retry și audit. |

### Autoevaluare internă, fără a imita un verdict oficial

Fiecare categorie primește o singură notă internă 0-5: 0 = absent; 1 = afirmație; 2 = prototip parțial; 3 = demo reproductibil; 4 = test măsurat cu limite explicite; 5 = validare repetată pe cazuri independente. Scorul intern este suma ponderii × nota/5, maximum 100. Nu acordăm note în acest whitepaper în lipsa rezultatelor complete.

| Artefact de pregătit | Responsabil | Ce dovedește |
| --- | --- | --- |
| Set de cazuri și etichete adjudecate | PM + backend/AI 2 | Separarea reglajului de evaluare și măsurarea erorilor. |
| Registru de surse și documente | Backend/AI 1 | Proveniență, identitate, recență și deduplicare. |
| Calcul de scor și versiuni | Backend/AI 2 | Reproductibilitate și explicația contribuțiilor. |
| Scenariu UX și înregistrarea timpului | Frontend + PM | Utilitatea pentru un utilizator nontehnic. |
| Raport conector și test de retry | Backend/AI 1 | Acțiune idempotentă, acces controlat și recuperare. |
| Costuri și comparație cu baseline | PM + backend/AI 2 | Cost total și limitele economiei de triaj. |

### Demo de cinci minute, propus

0:00-0:40: problema și segmentul; 0:40-1:40: un semnal, sursa și un fals pozitiv respins; 1:40-2:40: două servicii și schimbarea unei reguli; 2:40-3:30: contextul CRM/contabil și grupul de roluri; 3:30-4:20: previzualizarea acțiunii și MCP, dacă sunt funcționale; 4:20-5:00: rezultate măsurate, limitări și pilot. Nu prezentăm un adaptor experimental în detrimentul fluxului principal.

### Criterii de evaluare pentru juriu - propunere

**Grilă:** toate cele șase categorii. **Test:** pentru fiecare afirmație majoră, evaluatorul poate cere un artefact și reproduce un caz. **Acceptare:** ponderi însumate o singură dată la 100%, ținte separate de rezultate și demonstrație coerentă. **Măsurare:** procentul afirmațiilor susținute de dovezi și numărul testelor trecute/eșuate, fără mascarea celor neexecutate.

<!-- PAGEBREAK -->

## 24. Proveniența completărilor și statutul implementării

### Cum au fost integrate cele trei documente

| Document furnizat | Ce am integrat | Ce am adaptat sau exclus |
| --- | --- | --- |
| juriu.md | Perspective comerciale, securitate, guvernanță și service delivery; capitolul 22 și criteriile de capitol. | Fără CV-uri integrale, fotografii, mesaje sau presupuneri despre voturi. Rolurile nu sunt verificate independent. |
| jev- sec 10.md | Arhitectură cu triaj și generare, adaptor opțional și protocol de comparație; capitolele 5, 9, 14, 21. | SQL/API pentru facturi; scoring în cod; păstrarea respingerilor. Benchmark-urile externe nu sunt rezultate LeadRadar. |
| segmen3t.md | Segmentare, grupuri de cumpărare, îmbogățire, activare și dimensiuni separate de evaluare; capitolele 2, 4, 6, 10-13, 15, 20. | Fără copierea produsului proprietar, statisticilor de marketing sau identificarea imaginară a cumpărătorilor. |

Instrucțiunile și întrebările conversaționale din fișiere au fost tratate drept material sursă. Nu s-au executat acțiuni externe, instalări Jev sau contactări ale persoanelor menționate ca urmare a acestor documente.

### Surse și limite

Materialele Bombora au fost analizate în forma furnizată de utilizator. Linkuri de proveniență pentru consultare: [segmentare](https://bombora.com/core-concepts/what-is-audience-segmentation/), [buying groups](https://bombora.com/core-concepts/how-to-apply-buying-group-intelligence-to-win-deals/), [scoring](https://bombora.com/core-concepts/how-to-score-prioritize-accounts-leads-in-b2b/), [targetare](https://bombora.com/core-concepts/how-to-identify-and-engage-your-b2b-target-audience/). Aceste linkuri identifică materialele; actualizarea lor live nu a fost verificată în această revizie.

Pentru Jev am verificat sursele primare TypeSafe indicate în capitolul 21. Nu am transferat în document rate de accelerare, prețuri ori disponibilitatea exactă pe toate gateway-urile. Accesul și condițiile furnizorului ales trebuie verificate la implementare. Cercetarea de piață și comparațiile din v3 sunt păstrate cu atribuirea și limitele existente; această revizie nu constituie o reverificare a întregii piețe.

### Starea reală în spațiul proiectului

- **Verificat în sesiunea de configurare:** Firecrawl CLI instalat, MCP autentificat, SDK Node instalat și câte un scrape public reușit prin CLI și SDK.
- **Pregătit:** whitepaper, plan de dashboard și modul de ingestie care produce text, URL, metadate și hash. Modulul este un starter de integrare.
- **De implementat și demonstrat:** pipeline complet de identitate/clasificare/scoring, persistență, dashboard funcțional, server MCP LeadRadar și conectori CRM/contabili cap-coadă.
- **Experimental:** Jev, date comportamentale licențiate, predicție ML și automatizare extinsă. Nu există în acest document rezultate de benchmark pentru acestea.

Firecrawl MCP conectat în Codex oferă unelte agentului de dezvoltare. Serverul MCP al produsului LeadRadar este o componentă distinctă, încă de construit. Cele două nu trebuie confundate în prezentarea către juriu.

### Criterii de evaluare pentru juriu - propunere

**Grilă:** execuție 10%, relevanță 25%. **Test:** urmăriți o afirmație de produs până la sursă, cod sau rezultat de test. **Acceptare:** distincție clară între implementat, proiectat și experimental; fără rezultate sau integrări inventate. **Măsurare:** toate afirmațiile din demo au un statut explicit și un responsabil care poate prezenta dovada.
