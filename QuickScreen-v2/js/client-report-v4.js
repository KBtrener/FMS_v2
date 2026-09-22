/* Statyczna makieta raportu klienta — bez logiki aplikacyjnej. */
(function () {
  const videos = [
    ['Przykładowy film 1', 'https://www.youtube.com/'],
    ['Przykładowy film 2', 'https://www.youtube.com/'],
    ['Przykładowy film 3', 'https://www.youtube.com/']
  ];

  function videoLinks() {
    return `<ol class="client-report__links">${videos.map(([label, href]) =>
      `<li><a href="${href}" target="_blank" rel="noreferrer">${label}<span aria-hidden="true">↗</span></a></li>`
    ).join('')}</ol>`;
  }

  QSViews.clientResult = function () {
    return `<main class="report-page">
      <div class="report-page__tools">
        <a class="qs-back" href="#/client-panel">← Wróć do panelu klienta</a>
        <button class="btn btn-outline btn-sm" onclick="window.print()">Drukuj raport</button>
      </div>

      <article class="client-report">
        <header class="client-report__header">
          <span>KB Trener / QuickScreen</span>
          <b>Raport ruchowy</b>
          <span>07.09.2026 · QS-2026-0907</span>
        </header>

        <section class="client-report__hero">
          <p class="client-report__eyebrow">Raport dla Gawła Kota · Piłka nożna</p>
          <h1>Bazowy Test<br>Funkcjonalny</h1>
          <p>Twój osobisty punkt startowy do lepszego, pewniejszego ruchu.</p>
        </section>

        <section class="client-report__section report-intro">
          <p class="client-report__index">01 / Wstęp</p>
          <div class="client-report__copy">
            <h2>Hej! Przesyłam Ci Twój raport z Bazowego Testu Funkcjonalnego.</h2>
            <p>Bazowy Test Funkcjonalny sprawdza, jak radzisz sobie z podstawowymi wzorcami ruchu, które są bazą dla sportu i codziennej aktywności. Oceniamy ich jakość, asymetrie oraz ewentualny ból, żeby znaleźć obszary, w których organizm może kompensować i które warto poprawić w pierwszej kolejności.</p>
            <details class="report-intro__details">
              <summary>Pokaż, jak działa test <span aria-hidden="true">↓</span></summary>
              <div>
                <p>Test sprawdza, czy na bazowym poziomie jesteś w stanie wykonać podstawowe wzorce ruchowe, takie jak: martwy ciąg / skłon do palców, globalna mobilność barków, rotacja ciała, stabilność na jednej nodze, przysiad oraz podstawowe zakresy ruchu szyi.</p>
                <p>Wszystkie ruchy, które wykonujemy w sporcie i codziennym życiu, są zbudowane właśnie z takich podstawowych wzorców. Każdy z nich można później rozłożyć na bardziej szczegółowe elementy, np. mobilność i stabilność konkretnych stawów, albo połączyć z innymi wzorcami w bardziej złożone ruchy, takie jak bieganie, skakanie, jazda na łyżwach czy nawet prace w ogrodzie.</p>
                <p>W tym teście sprawdzamy, czy ruszasz się:</p>
                <dl class="report-intro__scale">
                  <div><dt>3 pkt</dt><dd>bardzo dobrze</dd></div>
                  <div><dt>2 pkt</dt><dd>dobrze</dd></div>
                  <div><dt>1 pkt</dt><dd>źle</dd></div>
                  <div><dt>0 pkt</dt><dd>z bólem</dd></div>
                </dl>
                <p>Jeżeli gdziekolwiek pojawia się wynik 1, ból lub wyraźna asymetria, oznacza to, że Twoje ciało będzie gdzieś kompensować i już na bardzo podstawowym poziomie nie jest w stanie wykonać danego ruchu optymalnie.</p>
                <p>W sporcie i życiu wyniki 0, 1 oraz asymetrie częściej pojawiają się u osób z kontuzjami, bólem lub problemami z nauczeniem się prawidłowej techniki, mimo wielu prób. Z mojego doświadczenia, zarówno u amatorów, jak i zawodowych sportowców, poprawa tych podstawowych wzorców potrafiła przełożyć się również na poprawę techniki.</p>
              </div>
            </details>
          </div>
        </section>

        <section class="client-report__section report-result">
          <p class="client-report__index">02 / Twój wynik</p>
          <div class="client-report__copy">
            <h2>Twój wynik</h2>
            <p>Jak czytać wynik: 3 pkt oznacza bardzo dobre wykonanie wzorca, 2 pkt — wynik akceptowalny, 1 pkt — wzorzec wymagający poprawy, a 0 pkt oznacza ból. W testach wykonywanych na obie strony wynik globalny jest równy słabszej stronie, a różnica między stronami oznacza asymetrię.</p>
            <p>Asymetria oznacza, że jedna strona radzi sobie z tym samym ruchem gorzej niż druga — nawet jeśli obie strony osiągają wynik uznawany za akceptowalny.</p>
            <p>Twoja szyja ma prawidłowy zakres ruchu i wszystkie testy szyi wykonałeś bez bólu.</p>
            <p>Skłon do palców wypadł bardzo dobrze — uzyskałeś 3 punkty po obu stronach.</p>
            <p>W rotacji uzyskałeś 3 punkty po lewej i 2 po prawej stronie, dlatego widzimy tutaj niewielką asymetrię. Globalny wynik tego testu to 2 punkty.</p>
            <p>W balansie uzyskałeś 2 punkty po lewej i 1 po prawej stronie. Oznacza to asymetrię, a globalny wynik testu wynosi 1 punkt.</p>
            <p>W teście globalnej mobilności barków uzyskałeś 1 punkt po obu stronach. Oznacza to, że ten wzorzec wymaga poprawy.</p>
            <p>Podczas przysiadu wystąpił ból, dlatego wynik tego testu to 0 punktów. Ból pojawił się również podczas testu wyprostu kręgosłupa.</p>
            <aside class="report-result__priority">
              <p class="client-report__eyebrow">Najważniejszy obszar do pracy</p>
              <h3>Najpierw zajmij się bólem.</h3>
              <p>Mimo że widzimy również ograniczenie mobilności barków oraz asymetrie w rotacji i balansie, w tej chwili mają one niższy priorytet. Ból może wpływać na sposób, w jaki wykonujesz pozostałe ruchy, dlatego najpierw warto go wyeliminować, a następnie wykonać test ponownie i dopiero na podstawie nowych wyników zdecydować, czym zająć się dalej.</p>
            </aside>
          </div>
        </section>

        <section class="client-report__section report-actions">
          <p class="client-report__index">03 / Co teraz musisz zrobić</p>
          <div class="client-report__copy">
            <h2>Prosta kolejność działania.</h2>
            <ol class="report-actions__axis">
              <li><span>01</span><b>Pozbyć się bólu</b></li>
              <li><span>02</span><b>Re-test za 3–4 tygodnie</b></li>
              <li><span>03</span><b>Poprawić globalną mobilność barków</b></li>
            </ol>
          </div>
        </section>

        <section class="client-report__section report-help">
          <p class="client-report__index">04 / Jak to zrobić</p>
          <div class="client-report__copy">
            <h2>Wybierz ścieżkę, która jest dla Ciebie wygodna.</h2>
            <div class="report-help__paths">
              <article>
                <p class="client-report__eyebrow">Samodzielnie</p>
                <h3>Materiały na start</h3>
                <p>Jeżeli chcesz spróbować na własną rękę, zacznij od tych materiałów:</p>
                ${videoLinks()}
              </article>
              <article>
                <p class="client-report__eyebrow">Z pomocą</p>
                <h3>Program w Trainerize</h3>
                <p>Gotowy program adresujący ten problem, kontakt ze mną i plan dostosowany pod Ciebie. Nagraj ćwiczenia albo umów dodatkowe spotkanie, żebym mógł pomóc Ci w szczegółach.</p>
                <a class="report-help__cta" href="https://www.trainerize.com/" target="_blank" rel="noreferrer">Kup program w Trainerize <span aria-hidden="true">→</span></a>
              </article>
            </div>
          </div>
        </section>

        <footer class="client-report__footer"><b>Move well. Move often.</b><span>Screening nie jest diagnozą medyczną i nie określa przyczyny bólu.</span></footer>
      </article>
    </main>`;
  };

  /* Raport jest dokumentem. Kliknięcia w jego treść nie mogą trafić do
     globalnego routera makiety i nie mogą zmienić aktualnej trasy. */
  document.addEventListener('click', function (event) {
    if (event.target.closest('.client-report')) event.stopImmediatePropagation();
  });
}());
