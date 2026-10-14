from pathlib import Path
import re

root = Path(__file__).parent
s = (root.parent / 'index.html').read_text(encoding='utf-8')
s = s.replace('width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no', 'width=device-width, initial-scale=1, viewport-fit=cover')
s = s.replace('</head>', '  <link rel="stylesheet" href="impeccable.css">\n</head>')
# Keep brand colors for surfaces; assign accessible text roles independently.
s = s.replace('--color-deep-rust: #B94E36', '--color-deep-rust: #963D29').replace('--color-muted-sage: #7F8870', '--color-muted-sage: #4D6244')
s = re.sub(r'font-size:\s*(\d+(?:\.\d+)?)px', lambda m: 'font-size: 14px' if float(m[1]) < 14 else m[0], s)
s = s.replace('color: var(--color-signal-orange)', 'color: var(--color-accent-ink)').replace('color: #888', 'color: #666').replace('color:#888', 'color:#666').replace('color: #777', 'color: #666')
s = s.replace('border-left: 3px', 'border-left: 1px')
s = s.replace('color:var(--color-signal-orange)', 'color:var(--color-accent-ink)').replace('color: #25D366', 'color: var(--color-muted-sage)')
s = s.replace('box-shadow: 0 4px 12px rgba(244, 119, 69, 0.25);', 'box-shadow: none;')
s = s.replace('box-shadow: 0 0 0 4px var(--color-signal-orange-light);', 'box-shadow: none;')
s = re.sub(r'    \.device-shell::before \{.*?\n    \}', '', s, flags=re.S)
s = re.sub(r'background: repeating-linear-gradient\(.*?\);', 'background: none; border-top: 2px dashed var(--color-signal-orange);', s, flags=re.S)
s = s.replace('background: var(--color-signal-orange);\n      color: #FFF;', 'background: var(--color-signal-orange);\n      color: var(--color-near-black);')
s = s.replace('.telemetry-text h4', '.telemetry-text h3')
s = re.sub(r'<(?:div|span) class="tag-mono"[^>]*>[^<]*</(?:div|span)>\s*(?=<h[12])', '', s)
s = s.replace('<h4', '<h3').replace('</h4>', '</h3>')
s = s.replace('<body>', '<body>\n<a class="skip-link" href="#screen-home">Ir ao conteúdo</a>')
s = s.replace('class="brand-group"', 'class="brand-group" role="button" tabindex="0" aria-label="VEREDA — início"')
s = s.replace('<nav class="bottom-bar">', '<nav class="bottom-bar" aria-label="Navegação principal">')
s = s.replace('<div class="nav-tab', '<div role="button" tabindex="0" class="nav-tab')
s = s.replace('<div class="feed-card-minimal"', '<div role="button" tabindex="0" class="feed-card-minimal"')
s = s.replace('<div class="hero-badge-tag"', '<div role="button" tabindex="0" class="hero-badge-tag"')
s = s.replace('<button class="icon-btn" onclick="closeModal', '<button aria-label="Fechar janela" class="icon-btn" onclick="closeModal')
s = s.replace('<span class="chip-sample" onclick="loadSampleLink()">EXEMPLO</span>', '<button type="button" class="chip-sample" onclick="loadSampleLink()">Usar exemplo</button>')
s = s.replace('type="text" id="targetUrlInput" value="https://quintoandar.com.br/imovel/894120"', 'type="url" inputmode="url" id="targetUrlInput" maxlength="2048" aria-describedby="inputHelp inputError"')
s = s.replace('<label class="tag-mono"', '<label for="targetUrlInput" class="tag-mono"', 1)
s = s.replace('LINK DO ANÚNCIO (ZAP, QUINTOANDAR, LOFT...)', 'Link do anúncio')
s = s.replace('<span>Auditar Imóvel</span>', '<span>Explorar análise de exemplo</span>')
s = s.replace('Cole o anúncio. Investigamos o histórico do edifício, custos reais ocultos e incongruências cadastrais antes de você agendar a visita.', 'Custos, entorno e perguntas para a visita. Veja o que considerar antes de decidir pelo próximo endereço.')
s = s.replace('<h1 class="title-serif">', '<div class="home-intro"><h1 class="title-serif">', 1)
s = s.replace('      <!-- Precision Intake Box -->', '      </div>\n      <!-- Precision Intake Box -->', 1)
s = s.replace('<div class="card-clean" style="padding: 16px;">', '<div class="card-clean intake-panel" style="padding: 16px;">', 1)
s = s.replace('        <button class="btn-primary" onclick="runInvestigation()">', '        <p id="inputHelp" class="field-help">Demonstração interativa: qualquer link válido abre os dados de exemplo da Bela Cintra. Nenhuma consulta externa é realizada.</p>\n        <p id="inputError" class="field-error" role="alert" hidden></p>\n        <button id="investigateButton" class="btn-primary" onclick="runInvestigation()">', 1)
s = s.replace('      <!-- Compact Feed -->', '      <section class="recent-section" aria-labelledby="recentHeading">\n      <!-- Compact Feed -->', 1)
s = s.replace('<span class="tag-mono" style="color: #666;">DOSSIÊS RECENTES AUDITADOS</span>', '<h2 id="recentHeading" class="section-heading">Sua próxima visita começa aqui</h2>')
s = s.replace('2 ativos</span>', '2 exemplos</span>', 1)
s = s.replace('    </main>\n\n    <!-- ==========================================\n         SCREEN 2', '      <p class="demo-caption">Valores e achados ilustrativos do protótipo original.</p>\n      </section>\n    </main>\n\n    <!-- ==========================================\n         SCREEN 2', 1)
s = s.replace('    <!-- ==========================================\n         SCREEN 1', '    <div class="prototype-notice"><span>Protótipo interativo · dados de exemplo</span><a href="http://localhost:8080" target="_blank" rel="noopener">Ver versão original ↗</a></div>\n    <!-- ==========================================\n         SCREEN 1', 1)
s = s.replace('Auditando dados territoriais & registros...', 'Preparando a análise de exemplo…')
s = s.replace('      <div class="telemetry-row">', '      <div class="telemetry-row">')
s = s.replace('      <div style="font-family: var(--font-mono); font-size: 14px; color: #666; margin-bottom: 20px;">', '      <div style="font-family: var(--font-mono); font-size: 14px; color: #666; margin-bottom: 20px;">')
s = s.replace('<img src="https://images.unsplash.com', '<img loading="lazy" decoding="async" width="800" height="450" src="https://images.unsplash.com')
s = s.replace('alt="Fachada Solar dos Franceses"', 'alt="Fotografia ilustrativa de um edifício residencial; não corresponde ao imóvel do exemplo"')
s = s.replace('<div class="sheet-card">', '<div class="sheet-card" role="dialog" aria-modal="true" tabindex="-1">')
s = s.replace('<span id="btnCopyLabel">Copiar Texto Formatado</span>', '<span id="btnCopyLabel" aria-live="polite">Copiar mensagem</span>')
s = s.replace('<div style="background:#FFF; border:1px solid var(--color-warm-paper-border); border-radius:10px; padding:12px; font-size: 14px; line-height:1.5; color:#222; margin-bottom:14px;">', '<div id="messagePayload" class="message-payload">')
# Do not send the second property's links to the first property's dossier.
s = s.replace('    <!-- ==========================================\n         STICKY BOTTOM', '''    <main id="screen-pauliceia" class="app-screen secondary-property" tabindex="-1">
      <h2 class="title-serif">Edifício Pauliceia</h2>
      <p class="lead-text">Avenida Paulista, 2584 · Bela Vista · 74 m²</p>
      <div class="cost-block"><span>Custo mensal no exemplo</span><div class="cost-num-real">R$ 5.150<span class="field-help">/mês</span></div></div>
      <h3>O que aparece na comparação</h3>
      <p>Trajeto plano de 3 minutos até o metrô e tombamento pelo CONDEPHAAT.</p>
      <p class="field-help">O protótipo disponibiliza o dossiê detalhado apenas do Solar dos Franceses. As informações desta alternativa são ilustrativas.</p>
      <button class="btn-dark" onclick="navTo('screen-compare')">Voltar à comparação</button>
    </main>
    <!-- ==========================================
         STICKY BOTTOM''')
s = re.sub(r'  <!-- Interactive Navigation & Telemetry Logic -->.*?</script>', '  <script src="impeccable.js" defer></script>', s, flags=re.S)
# Keep comparison metadata in compare.html and reports, outside the product UI.
s = re.sub(r'    <div class="prototype-notice">.*?</div>\n', '', s)
s = re.sub(r'\s*<p id="inputHelp".*?</p>', '', s)
s = s.replace('aria-describedby="inputHelp inputError"', 'aria-describedby="inputError"')
s = re.sub(r'\s*<p class="demo-caption">.*?</p>', '', s)
s = re.sub(r'\s*<p class="field-help">O protótipo disponibiliza.*?</p>', '', s)
s = s.replace('Usar exemplo', 'Preencher link')
s = s.replace('Explorar análise de exemplo', 'Auditar imóvel')
s = s.replace('2 exemplos', '2 ativos')
s = s.replace('Preparando a análise de exemplo…', 'Preparando análise do imóvel…')
s = s.replace('Custo mensal no exemplo', 'Custo mensal')
s = s.replace('Fotografia ilustrativa de um edifício residencial; não corresponde ao imóvel do exemplo', 'Edifício residencial')
def icon(paths):
    return '<svg class="ui-symbol" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>'
alert_icon = icon('<path d="M10.3 3.9 1.8 18.5A1.7 1.7 0 0 0 3.3 21h17.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>')
check_icon = icon('<path d="m5 12 4 4L19 6"/>')
close_icon = icon('<path d="m6 6 12 12M18 6 6 18"/>')
s = s.replace('⚠️ ', alert_icon + '<span class="sr-only">Alerta: </span>')
s = s.replace('✓ ', check_icon + '<span class="sr-only">Verificado: </span>')
s = s.replace('<div class="telemetry-icon done">✓</div>', '<div class="telemetry-icon done" role="img" aria-label="Etapa concluída">' + check_icon + '</div>')
s = s.replace('>✕</button>', '>' + close_icon + '</button>')
s = s.replace('⚖️ ', '')
s = s.replace('visita →', 'visita')
(root/'index.html').write_text(s, encoding='utf-8')
print('Refined HTML generated; original remains untouched.')
