/*
 * Faixa de divulgação do Réveillon Solar 2027.
 * Arquivo único e idêntico nos dois cardápios (Hotel Solar e Reserva Solar).
 *
 * Para ajustar a campanha, mexa apenas no bloco CONFIG abaixo.
 * Para tirar a faixa do ar antes da data, basta trocar ativo: false.
 */
(function () {
    'use strict';

    var CONFIG = {
        ativo: true,

        // A faixa só aparece dentro desta janela (datas inclusive).
        // Some sozinha em 1º de janeiro de 2027.
        mostrarDe: '2026-09-02',
        mostrarAte: '2026-12-31',

        // Data da virada, usada na contagem regressiva.
        viradaAno: 2026, viradaMes: 12, viradaDia: 31,

        // Link direto para o pacote no motor de reservas.
        destino: 'https://reservas.hotelsolar.tur.br/?pacote=0267abd7-ba19-4492-8894-aea827edea33' +
                 '&utm_source=cardapio&utm_medium=faixa&utm_campaign=reveillon2027' +
                 '#pacote-0267abd7-ba19-4492-8894-aea827edea33',

        // Quantos dias a faixa fica escondida depois que o cliente fecha.
        // Zero = não lembra: a faixa reaparece toda vez que o cardápio é aberto.
        // O X segue funcionando para tirá-la da frente durante a leitura.
        diasOcultoAposFechar: 0,

        // Segundos até a faixa subir, para não competir com o carregamento do cardápio.
        atrasoSegundos: 1.5
    };

    var TEXTOS = {
        pt: {
            titulo: 'Réveillon Solar 2027',
            desc: '31/12 · Ceia, open bar, DJ e banda à beira-mar.',
            cta: 'Ver o pacote',
            fechar: 'Fechar',
            contagem: function (d) {
                if (d <= 0) return 'a virada é hoje';
                return d === 1 ? 'falta 1 dia' : 'faltam ' + d + ' dias';
            }
        },
        en: {
            titulo: 'New Year’s Eve 2027',
            desc: 'Dec 31 · Dinner, open bar, DJ and live band by the sea.',
            cta: 'See the package',
            fechar: 'Close',
            contagem: function (d) {
                if (d <= 0) return 'tonight’s the night';
                return d === 1 ? '1 day to go' : d + ' days to go';
            }
        },
        es: {
            titulo: 'Fin de Año 2027',
            desc: '31/12 · Cena, open bar, DJ y banda frente al mar.',
            cta: 'Ver el paquete',
            fechar: 'Cerrar',
            contagem: function (d) {
                if (d <= 0) return 'la fiesta es hoy';
                return d === 1 ? 'falta 1 día' : 'faltan ' + d + ' días';
            }
        },
        fr: {
            titulo: 'Réveillon 2027',
            desc: '31/12 · Dîner, open bar, DJ et groupe live face à la mer.',
            cta: 'Voir le forfait',
            fechar: 'Fermer',
            contagem: function (d) {
                if (d <= 0) return 'c’est ce soir';
                return 'J-' + d;
            }
        },
        it: {
            titulo: 'Capodanno 2027',
            desc: '31/12 · Cena, open bar, DJ e band dal vivo sul mare.',
            cta: 'Vedi il pacchetto',
            fechar: 'Chiudi',
            contagem: function (d) {
                if (d <= 0) return 'è stasera';
                return d === 1 ? 'manca 1 giorno' : 'mancano ' + d + ' giorni';
            }
        }
    };

    var CHAVE_FECHOU = 'reveillon2027_fechado_ate';

    // Abrir o cardápio com ?preview=reveillon força a faixa a aparecer fora da
    // janela da campanha. Serve só para conferir o visual.
    function modoPreview() {
        return location.search.indexOf('preview=reveillon') !== -1;
    }

    function dentroDaJanela() {
        var hoje = new Date();
        var hojeISO = hoje.getFullYear() + '-' +
            String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
            String(hoje.getDate()).padStart(2, '0');
        return hojeISO >= CONFIG.mostrarDe && hojeISO <= CONFIG.mostrarAte;
    }

    function diasAteAVirada() {
        var hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        var virada = new Date(CONFIG.viradaAno, CONFIG.viradaMes - 1, CONFIG.viradaDia);
        return Math.round((virada - hoje) / 86400000);
    }

    function foiFechadaRecentemente() {
        if (CONFIG.diasOcultoAposFechar <= 0) return false;
        try {
            var ate = localStorage.getItem(CHAVE_FECHOU);
            return !!ate && Date.now() < Number(ate);
        } catch (e) {
            return false; // navegador sem localStorage: mostra a faixa mesmo assim
        }
    }

    function marcarComoFechada() {
        try {
            if (CONFIG.diasOcultoAposFechar <= 0) {
                // Limpa a marca de quem já fechou antes desta mudança, senão
                // esse cliente seguiria sem ver a faixa até o prazo antigo vencer.
                localStorage.removeItem(CHAVE_FECHOU);
                return;
            }
            var prazo = Date.now() + CONFIG.diasOcultoAposFechar * 24 * 60 * 60 * 1000;
            localStorage.setItem(CHAVE_FECHOU, String(prazo));
        } catch (e) { /* sem localStorage: a faixa volta na próxima visita */ }
    }

    // O Hotel Solar guarda o idioma em 'language'; o Reserva Solar em 'reserva_language'.
    function idiomaAtual() {
        var lang;
        try {
            lang = localStorage.getItem('language') || localStorage.getItem('reserva_language');
        } catch (e) { /* ignora */ }
        return TEXTOS[lang] ? lang : 'pt';
    }

    function injetarEstilo() {
        var css = [
            /* Céu da virada: noite sobre o mar, com brilho dourado a partir do centro. */
            '.reveillon-faixa{',
            '  position:fixed;left:0;right:0;bottom:0;z-index:200;',
            '  display:flex;align-items:center;gap:14px;',
            '  padding:13px 16px calc(13px + env(safe-area-inset-bottom));',
            '  background:',
            '    radial-gradient(120% 180% at 62% 120%,rgba(214,168,74,.30) 0%,rgba(214,168,74,0) 58%),',
            '    linear-gradient(103deg,#05070F 0%,#0D1428 42%,#1C1436 74%,#2B1A31 100%);',
            '  border-top:1px solid rgba(214,168,74,.5);',
            '  box-shadow:0 -10px 32px rgba(0,0,0,.42);',
            '  font-family:\'Inter\',sans-serif;color:#F6F1E6;',
            '  overflow:hidden;isolation:isolate;',
            '  transform:translateY(115%);transition:transform .5s cubic-bezier(.22,.9,.3,1);',
            '}',
            '.reveillon-faixa.is-visivel{transform:translateY(0);}',

            /* Camada decorativa: estrelas piscando e fogos estourando. */
            '.reveillon-faixa__ceu{',
            '  position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden;',
            '}',
            '.reveillon-faixa__estrela{',
            '  position:absolute;width:2px;height:2px;border-radius:50%;background:#FFF6DF;',
            '  opacity:0;animation:reveillonPisca 3.4s ease-in-out infinite;',
            '}',
            '.reveillon-faixa__fogo{',
            '  position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;',
            '  border-radius:50%;opacity:0;',
            '  background:radial-gradient(circle,rgba(255,236,196,.95) 0%,rgba(214,168,74,.55) 32%,rgba(214,168,74,0) 68%);',
            '  animation:reveillonEstoura 5.2s ease-out infinite;',
            '}',
            '.reveillon-faixa__fogo::after{',
            '  content:"";position:absolute;inset:12px;border-radius:50%;',
            '  border:1px solid rgba(255,241,214,.55);',
            '}',
            '@keyframes reveillonPisca{',
            '  0%,100%{opacity:0;transform:scale(.6);}',
            '  45%{opacity:.9;transform:scale(1);}',
            '}',
            '@keyframes reveillonEstoura{',
            '  0%{opacity:0;transform:scale(.15);}',
            '  12%{opacity:.85;}',
            '  46%{opacity:0;transform:scale(1.25);}',
            '  100%{opacity:0;transform:scale(1.25);}',
            '}',

            '.reveillon-faixa__texto{flex:1;min-width:0;}',
            '.reveillon-faixa__contagem{',
            '  display:inline-flex;align-items:center;gap:5px;margin-bottom:4px;',
            '  padding:2px 9px;border-radius:999px;',
            '  background:rgba(214,168,74,.15);border:1px solid rgba(214,168,74,.42);',
            '  font-size:.6rem;letter-spacing:.13em;text-transform:uppercase;',
            '  font-weight:700;color:#EFC97E;white-space:nowrap;',
            '}',
            '.reveillon-faixa__contagem::before{content:"\\2726";font-size:.66rem;line-height:1;}',
            '.reveillon-faixa__titulo{',
            '  display:block;font-family:\'Playfair Display\',serif;font-size:1.15rem;',
            '  font-weight:700;line-height:1.18;',
            '  background:linear-gradient(92deg,#FFF4DE 0%,#F0CE8A 42%,#D6A84A 100%);',
            '  -webkit-background-clip:text;background-clip:text;color:transparent;',
            '}',
            '.reveillon-faixa__desc{',
            '  display:block;font-size:.76rem;line-height:1.35;color:#BDB6C6;margin-top:3px;',
            '  overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;',
            '}',
            '.reveillon-faixa__cta{',
            '  flex-shrink:0;display:inline-block;padding:11px 20px;border-radius:999px;',
            '  background:linear-gradient(135deg,#F3D590 0%,#D6A84A 100%);color:#1A1206;',
            '  font-size:.82rem;font-weight:700;text-decoration:none;white-space:nowrap;',
            '  box-shadow:0 3px 16px rgba(214,168,74,.34);',
            '  transition:filter .2s ease,transform .2s ease;',
            '}',
            '.reveillon-faixa__cta:hover{filter:brightness(1.08);transform:translateY(-1px);}',
            '.reveillon-faixa__fechar{',
            '  flex-shrink:0;width:34px;height:34px;border:0;border-radius:50%;',
            '  background:rgba(246,241,230,.09);color:#BDB6C6;font-size:1.05rem;line-height:1;',
            '  cursor:pointer;transition:background .2s ease,color .2s ease;',
            '}',
            '.reveillon-faixa__fechar:hover{background:rgba(246,241,230,.18);color:#F6F1E6;}',

            '@media (max-width:600px){',
            '  .reveillon-faixa{gap:10px;padding:11px 12px calc(11px + env(safe-area-inset-bottom));}',
            '  .reveillon-faixa__titulo{font-size:1.02rem;}',
            '  .reveillon-faixa__desc{font-size:.71rem;}',
            '  .reveillon-faixa__cta{padding:10px 15px;font-size:.76rem;}',
            '}',
            /* Sem animação para quem pediu menos movimento no sistema. */
            '@media (prefers-reduced-motion:reduce){',
            '  .reveillon-faixa{transition:none;}',
            '  .reveillon-faixa__estrela,.reveillon-faixa__fogo{animation:none;opacity:.5;}',
            '}',
            '@media print{.reveillon-faixa{display:none !important;}}'
        ].join('\n');

        var tag = document.createElement('style');
        tag.textContent = css;
        document.head.appendChild(tag);
    }

    function montarCeu() {
        var ceu = document.createElement('span');
        ceu.className = 'reveillon-faixa__ceu';
        ceu.setAttribute('aria-hidden', 'true');

        // Estrelas espalhadas, cada uma com seu próprio ritmo.
        var estrelas = [
            [8, 30], [15, 68], [23, 22], [31, 78], [40, 38],
            [52, 18], [61, 62], [70, 28], [78, 72], [86, 40], [93, 24]
        ];
        estrelas.forEach(function (pos, i) {
            var e = document.createElement('span');
            e.className = 'reveillon-faixa__estrela';
            e.style.left = pos[0] + '%';
            e.style.top = pos[1] + '%';
            e.style.animationDelay = (i * 0.29).toFixed(2) + 's';
            ceu.appendChild(e);
        });

        // Três fogos em tempos diferentes, para não estourarem juntos.
        [[26, 34, 0], [58, 26, 1.7], [82, 46, 3.4]].forEach(function (f) {
            var fogo = document.createElement('span');
            fogo.className = 'reveillon-faixa__fogo';
            fogo.style.left = f[0] + '%';
            fogo.style.top = f[1] + '%';
            fogo.style.animationDelay = f[2] + 's';
            ceu.appendChild(fogo);
        });

        return ceu;
    }

    function montar() {
        injetarEstilo();

        var faixa = document.createElement('aside');
        faixa.className = 'reveillon-faixa';
        faixa.setAttribute('role', 'complementary');
        faixa.appendChild(montarCeu());

        var texto = document.createElement('div');
        texto.className = 'reveillon-faixa__texto';

        var contagem = document.createElement('span');
        contagem.className = 'reveillon-faixa__contagem';

        var titulo = document.createElement('span');
        titulo.className = 'reveillon-faixa__titulo';

        var desc = document.createElement('span');
        desc.className = 'reveillon-faixa__desc';

        texto.appendChild(contagem);
        texto.appendChild(titulo);
        texto.appendChild(desc);

        var cta = document.createElement('a');
        cta.className = 'reveillon-faixa__cta';
        cta.href = CONFIG.destino;
        cta.target = '_blank';
        cta.rel = 'noopener';

        var fechar = document.createElement('button');
        fechar.className = 'reveillon-faixa__fechar';
        fechar.type = 'button';
        fechar.innerHTML = '&times;';

        faixa.appendChild(texto);
        faixa.appendChild(cta);
        faixa.appendChild(fechar);
        document.body.appendChild(faixa);

        function traduzir() {
            var t = TEXTOS[idiomaAtual()];
            contagem.textContent = t.contagem(diasAteAVirada());
            titulo.textContent = t.titulo;
            desc.textContent = t.desc;
            cta.textContent = t.cta;
            fechar.setAttribute('aria-label', t.fechar);
            faixa.setAttribute('aria-label', t.titulo);
        }

        function reservarEspaco() {
            if (!faixa.isConnected) return;
            document.body.style.paddingBottom = (faixa.offsetHeight + 12) + 'px';
        }

        traduzir();

        // Acompanha a troca de bandeirinha do cardápio.
        document.querySelectorAll('.lang-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setTimeout(function () { traduzir(); reservarEspaco(); }, 0);
            });
        });

        fechar.addEventListener('click', function () {
            faixa.classList.remove('is-visivel');
            document.body.style.paddingBottom = '';
            marcarComoFechada();
            setTimeout(function () { faixa.remove(); }, 550);
        });

        setTimeout(function () {
            faixa.classList.add('is-visivel');
            reservarEspaco();
        }, CONFIG.atrasoSegundos * 1000);

        window.addEventListener('resize', reservarEspaco);
    }

    if (CONFIG.diasOcultoAposFechar <= 0) {
        try { localStorage.removeItem(CHAVE_FECHOU); } catch (e) { /* ignora */ }
    }

    if (!modoPreview()) {
        if (!CONFIG.ativo || !dentroDaJanela() || foiFechadaRecentemente()) return;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', montar);
    } else {
        montar();
    }
})();
