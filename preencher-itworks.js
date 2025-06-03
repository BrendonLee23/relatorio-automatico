import { readFileSync } from 'fs';
import { launch } from 'puppeteer';

(async () => {
  try {
    const raw = readFileSync(process.argv[2], 'utf8');
    const data = JSON.parse(raw);

    const browser = await launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://itworks.com.br/controle/');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'brendo.business1@gmail.com');
    await page.type('input[name="senha"]', 'Brendo@123');
    await page.click('#m_login_signin_submit');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    for (const item of data) {
      await page.goto('https://itworks.com.br/controle/lancamentos');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.click('button[data-target="#adicionar"]');
      await page.waitForSelector('input[placeholder="Data"]');

      // DATA
      await page.evaluate((data) => {
        const input = document.querySelector('#data_inicio_cad');
        if (input) {
          input.value = data;
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
      }, item.Data);
      await new Promise(resolve => setTimeout(resolve, 500));

      // INÍCIO
      await page.waitForSelector('#hora_inicio_cad', { visible: true });
      await page.click('#hora_inicio_cad', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type(item.Inicio);
      await new Promise(resolve => setTimeout(resolve, 500));

      // FIM
      await page.waitForSelector('#hora_fim_cad', { visible: true });
      await page.click('#hora_fim_cad', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type(item.Fim);
      await new Promise(resolve => setTimeout(resolve, 500));

      // CENTRO DE CUSTO
      await page.select('select[name="centro"]', '1');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // SERVIÇO
      await page.waitForFunction(() => {
        const s = document.querySelector('select[name="servico"]');
        return s && s.options.length > 1 && s.options[1].value !== '0';
      }, { timeout: 10000 });
      await page.select('select[name="servico"]', '2');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // CATEGORIA
      await page.waitForFunction(() => {
        const c = document.querySelector('select[name="categoria"]');
        return c && c.options.length > 1 && c.options[1].value !== '0';
      }, { timeout: 10000 });
      await page.select('select[name="categoria"]', '2');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // SUBCATEGORIA
      await page.waitForFunction(() => {
        const sc = document.querySelector('select[name="subcategoria"]');
        if (!sc) return false;
        return Array.from(sc.options).some(opt => opt.value === '7');
      }, { timeout: 10000 });
      await page.select('select[name="subcategoria"]', '7');
      await new Promise(resolve => setTimeout(resolve, 500));

      // TÍTULO E DESCRIÇÃO
      await page.type('input[placeholder="Título"]', 'IMPOSTOGRAMA E IMPOSTOCERTO');
      await page.type('textarea[placeholder="Descrição"]', item.Descricao);

      // SUBMISSÃO
      await page.waitForSelector('form[action*="lancamentos/novo"]');
      await page.evaluate(() => {
        const form = document.querySelector('form[action*="lancamentos/novo"]');
        if (form) {
          requestAnimationFrame(() => form.submit());
        }
      });

      // Aguardando retorno
      await page.waitForFunction(() =>
        window.location.href.includes('/controle/lancamentos/novo') &&
        document.body.innerText.includes('Lançamento adicionado com sucesso'),
        { timeout: 15000 }
      );
    }

    await browser.close();
  } catch (err) {
    console.error("ERRO:", err.message);
  }
})();
