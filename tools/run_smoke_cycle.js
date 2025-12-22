const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://127.0.0.1:8000/ai-betting-system.html';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));
  // Log any failed network requests with URL and error for diagnosis
  page.on('requestfailed', request => {
    try {
      const f = request.failure();
      const err = f && f.errorText ? f.errorText : JSON.stringify(f);
      console.log('PAGE: REQUEST_FAILED', request.url(), err);
    } catch (e) {
      console.log('PAGE: REQUEST_FAILED', request.url(), 'unknown failure');
    }
  });
  // Also log any responses with HTTP error status codes (404/500 etc.)
  page.on('response', response => {
    try {
      const status = response.status();
      if (status >= 400) {
        console.log('PAGE: RESPONSE_ERROR', status, response.url());
      }
    } catch (e) {
      // ignore
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));

    const result = await page.evaluate(async () => {
      if (typeof ai === 'undefined') return { error: 'AI not found' };

      const before = { bets: ai.model.totalBets || 0, wins: ai.model.wins || 0, losses: ai.model.losses || 0 };

      // Force live analysis (may be skipped if API quota prevents it)
      let analysis = { ran: false, message: '' };
      try {
        const res = await analyzeTodaysGames(true);
        analysis.ran = true;
        analysis.message = 'analyzeTodaysGames completed';
      } catch (e) {
        analysis.message = 'analyzeTodaysGames error: ' + (e && e.message ? e.message : String(e));
      }

      // Wait a bit for predictions to be created/displayed
      await new Promise(r => setTimeout(r, 2000));

      // Attempt to auto-settle today's bets
      let settledSummary = { attempted: false, message: '' };
      try {
        await settleTodaysBets();
        settledSummary.attempted = true;
        settledSummary.message = 'settleTodaysBets completed';
      } catch (e) {
        settledSummary.message = 'settleTodaysBets error: ' + (e && e.message ? e.message : String(e));
      }

      // Run learning cycle (AI learning from settled bets)
      let learning = { ran: false, insights: null };
      try {
        // Ensure `predictions` is a plain array (sometimes handles or other types leak in).
        try {
          if (!Array.isArray(window.predictions)) {
            const stored = localStorage.getItem('predictions');
            const parsed = stored ? JSON.parse(stored) : [];
            window.predictions = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) {
          window.predictions = [];
        }

        let insights = null;
        if (typeof runLearningCycle !== 'undefined' && typeof runLearningCycle === 'function') {
          insights = runLearningCycle();
        } else if (typeof ai !== 'undefined' && typeof ai.learn === 'function') {
          insights = ai.learn();
        }
        learning.ran = true;
        learning.insights = insights || null;
      } catch (e) {
        learning.insights = 'learning error: ' + (e && e.message ? e.message : String(e));
      }

      const after = { bets: ai.model.totalBets || 0, wins: ai.model.wins || 0, losses: ai.model.losses || 0 };

      return { before, analysis, settledSummary, learning, after };
    });

    console.log('SMOKE TEST RESULT:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Smoke test failed', err);
  } finally {
    await browser.close();
  }
})();
