# Relatórios de validação

## Lighthouse

Auditoria local do build otimizado com o cenário padrão, imagens, fontes, REST e Socket.IO ativos. Foram realizadas três medições por página e perfil. Os valores abaixo são as medianas.

| Página e perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| inicio-desktop | 99 | 100 | 100 | 100 | 0.89 s | 0.0001 | 0.0 ms |
| inicio-mobile | 90 | 100 | 100 | 100 | 3.49 s | 0.0000 | 119.5 ms |
| detalhe-desktop | 100 | 100 | 100 | 100 | 0.82 s | 0.0295 | 0.0 ms |
| detalhe-mobile | 91 | 100 | 100 | 100 | 3.39 s | 0.0000 | 71.5 ms |

As medianas atingiram as metas do enunciado. A primeira execução do detalhe mobile registrou uma variação de processamento e nota 73. As duas execuções seguintes registraram 92 e 91, com mediana 91.

O arquivo [lighthouse-summary.json](lighthouse-summary.json) contém as medições e o ambiente. O arquivo [lighthouse-reports.zip](lighthouse-reports.zip) reúne os relatórios HTML e JSON das 12 execuções.

Ferramentas usadas nesta execução foram Lighthouse 13.6.0, v26.0.0, Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36, em darwin 25.5.0 arm64. A configuração reproduzível está em [scripts/lighthouse.mjs](../scripts/lighthouse.mjs).

## Playwright

Os testes exercitam REST pelo MSW e eventos pelo cliente Socket.IO. Cada teste usa um contexto isolado. As referências visuais versionadas cobrem início, detalhe, carrinho e pagamento em desktop e mobile.

Execute `npm test` para gerar o relatório HTML e manter traces das falhas. O resultado final da validação será registrado nesta pasta.
