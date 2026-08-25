# Matriz CRO — Gobeaute & GoJump

Painel único de experimentação: o que já foi testado, o que ganhou, quanto isso rendeu e o que
vem a seguir. Os dados vêm do **Elevate** (resultados de A/B) e do **Jira** (roadmap), e a página
é um HTML estático gerado no build — sem servidor, sem banco, sem chave no cliente.

Quatro visões:

| Aba | O que responde |
|---|---|
| **Matriz de testes** | A mesma tese ganhou em quais marcas? Famílias × lojas, com o lift de RPV em cada célula. |
| **Testes A/B** | Todos os testes, com CR / RPV / AOV / add-to-cart em controle → variação e a significância. |
| **Ganho acumulado** | Quanto a loja (e a empresa) subiu compondo os vencedores, contra uma meta. |
| **Roadmap** | O que está planejado por vertical, com bloqueios e link para o card do Jira. |

## Como roda

```
npm run fetch     # Elevate + Jira  -> data/*.json
npm run build     # data + template -> dist/index.html
npm run refresh   # os dois
```

O `dist/index.html` é autocontido: dados embutidos, Poppins inline em base64, zero requisição
externa. Dá para abrir com duplo clique, servir de qualquer lugar ou anexar num e-mail.

Em produção o [workflow](.github/workflows/refresh.yml) faz isso sozinho às **08:00 de Fortaleza,
dias úteis**, comita o snapshot em `data/` e sobe a página como artefato do build.
Dá para disparar na mão em Actions → *Atualizar matriz CRO* → *Run workflow*.

## Segredos

Configure em *Settings → Secrets and variables → Actions*:

| Secret | Para quê |
|---|---|
| `ELEVATE_APICE`, `ELEVATE_BARBOURS`, `ELEVATE_KOKESHI`, `ELEVATE_RITUARIA`, `ELEVATE_LESCENT` | Gobeaute — um token por loja. Só as lojas com token são consultadas. |
| `ELEVATE_WAK_US`, `ELEVATE_POTTD_EU`, `ELEVATE_POTTD_UK`, `ELEVATE_POTTD_AU`, `ELEVATE_LOC` | GoJump — uma instância do Elevate por região, logo um token por região. |
| `JIRA_EMAIL`, `JIRA_API_TOKEN` | Roadmap. Sem eles, o `data/roadmap.json` anterior é preservado e o build segue. |

Variáveis opcionais: `JIRA_HOST` (padrão `goengenharia.atlassian.net`) e `ENABLE_PAGES=true`
para publicar no GitHub Pages.

Local: copie `.env.example` para `.env` e use `node --env-file=.env scripts/fetch-elevate.mjs`.
**Nenhum token entra no repositório** — `.env` está no `.gitignore` e o HTML gerado não carrega credencial.

## Ligar uma loja nova

1. Gere o token dela no Elevate.
2. Acrescente a linha em [`scripts/config.mjs`](scripts/config.mjs) (`STORES`), com a `currency` correta.
3. Cadastre o secret `ELEVATE_<CHAVE>` e passe-o no [workflow](.github/workflows/refresh.yml).

Só isso. A loja vira coluna na matriz, entra no ranking de ganho acumulado e passa a contar na
média da vertical.

## Como os números são calculados

**Vencedor** é a variação com probabilidade ≥ 95% de ser a melhor em **RPV** (receita por
visitante), a meta de todos os testes. O mesmo corte vale para o controle. Abaixo disso, o teste é
**inconclusivo**. O limite é configurável em `SIGNIFICANCE`.

Em testes A/B/C, a comparação é sempre **a variação de maior RPV contra o controle**.

**Ganho acumulado** compõe os lifts dos vencedores em ordem de encerramento —
`(1+l₁)×(1+l₂)…−1`. Isso pressupõe que todo vencedor foi escalado a 100% e que os efeitos não se
sobrepõem; na prática eles se sobrepõem, então o número é o **teto do ganho**, não receita
garantida. A visão por empresa é a média ponderada pela receita observada de cada loja nos testes —
exceto quando a vertical mistura moedas, e aí o peso é por **visitantes** (veja abaixo).

**Incremento** = (RPV da variação − RPV do controle) × visitantes da variação, dentro da janela do teste.

**Moeda.** Cada loja fatura na sua (`currency` em `scripts/config.mjs`; o fetch confere contra o
Elevate e avisa se divergir) e **não há conversão** — não queremos um número que depende de uma taxa
de câmbio escolhida no build. Consequências:

- RPV, AOV e incremento aparecem sempre na moeda da loja: `R$`, `US$`, `€`, `£`, `A$`.
- Totais que cruzam moedas são **quebrados por moeda** em vez de somados — é o que você vê em
  *Incremento medido* e *Perda evitada* quando o escopo é o GoJump inteiro.
- Peso da loja na média da vertical: receita observada quando a vertical tem uma moeda só (Gobeaute),
  visitantes quando mistura (GoJump), porque receita em moedas diferentes não é comparável.

Lifts, CR e add-to-cart são percentuais, então atravessam moeda sem problema — a matriz e o ganho
acumulado seguem comparáveis entre todas as marcas.

**Famílias** agrupam a mesma tese testada em marcas diferentes. O Elevate não expõe agrupamento,
então elas são derivadas do nome do teste pelas regras em
[`scripts/families.mjs`](scripts/families.mjs) — é lá que se corrige um agrupamento errado.

## Estrutura

```
scripts/config.mjs     lojas, verticais, fontes do Jira, corte de significância
scripts/elevate.mjs    cliente JSON-RPC/SSE do Elevate, com retry e pool de concorrência
scripts/families.mjs   regras de agrupamento em famílias
scripts/fetch-*.mjs    coleta -> data/*.json
scripts/build.mjs      data + src/template.html -> dist/index.html
src/template.html      a página (CSS, JS e Poppins embutidos)
data/                  último snapshot, versionado para dar histórico e permitir build sem segredo
```
