# Relatórios de validação

## Lighthouse

Auditoria local do build otimizado, com o cenário padrão, imagens, fontes, REST e Socket.IO ativos. Foram realizadas três medições por página e perfil. Os valores abaixo são as medianas do build final.

| Página e perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| inicio-desktop | 100 | 100 | 100 | 100 | 0.81 s | 0.0001 | 0.0 ms |
| inicio-mobile | 88 | 100 | 100 | 100 | 3.62 s | 0.0000 | 139.5 ms |
| detalhe-desktop | 98 | 100 | 100 | 100 | 0.92 s | 0.0655 | 0.0 ms |
| detalhe-mobile | 88 | 100 | 100 | 100 | 3.79 s | 0.0000 | 87.5 ms |

A performance mobile ficou em 88 nas duas páginas, abaixo da meta 90. As categorias de acessibilidade, boas práticas e SEO atingiram 100 em todos os perfis. O carregamento inicial precisa iniciar o MSW e a camada do protocolo Socket.IO antes da aplicação, com cerca de 170 KB comprimidos apenas nesse módulo. O carregamento de JavaScript e a inicialização dos clientes participam do caminho até o LCP, que ficou entre 3,6 e 3,8 segundos nas medianas mobile. Os relatórios completos registram os custos de rede e processamento. Essa limitação de performance permanece documentada para a avaliação.

A versão antecipa a imagem principal, mantém os assets locais, carrega conta e pagamento sob demanda e usa hashes prontos nas duas contas fictícias iniciais. A auditoria executou as funcionalidades completas da demonstração.

O arquivo [lighthouse-summary.json](lighthouse-summary.json) contém as medições e o ambiente. O arquivo [lighthouse-reports.zip](lighthouse-reports.zip) reúne os relatórios HTML e JSON das 12 execuções.

As ferramentas desta execução foram Lighthouse 13.6.0, Node.js v26.0.0, Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36, em darwin 25.5.0 arm64. A configuração reproduzível está em [scripts/lighthouse.mjs](../scripts/lighthouse.mjs).

## Playwright

A validação final completou 50 testes com sucesso em 58,6 segundos, incluindo a comparação às oito baselines existentes de início, detalhe, carrinho e pagamento. Todos os testes foram executados, em desktop de 1440 px, mobile de 390 px e verificações adicionais de tablet de 768 px.

Os testes exercitam REST pelo MSW e eventos pelo cliente Socket.IO. Cada teste usa um contexto isolado. O arquivo [playwright-html.zip](playwright-html.zip) contém o relatório HTML completo. A configuração mantém traces quando há falhas.

A suíte foi executada com Playwright 1.65.0 e Chromium 158.0.8127.18, canal Chromium completo em modo headless.

O código do build validado corresponde ao commit `69637f03c861848822c6cf60583b0b27000cad93`.
