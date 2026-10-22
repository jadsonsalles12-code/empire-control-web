# Empire Control — Etapa 2: Backend seguro (planejamento)

**Estado:** documentação técnica, **sem backend implantado e sem pareamento ativo**.
Base existente: Empire Control Web v1.8.0 (GitHub Pages) e motor Empire Control v1.7.15 (Windows, Python, EmpireCore 0.58.1, BR1).

## Objetivo

Proteger os dados futuros do usuário e permitir, depois, sincronização **somente leitura** do motor Windows com o site. O site continuará estático no GitHub Pages; dados e autorização serão tratados exclusivamente pelo Supabase.

## Etapas de implementação

1. Criar um projeto Supabase na organização escolhida pelo proprietário e verificar custos do projeto.
2. Configurar Supabase Auth com URL de redirecionamento exata `https://jadsonsalles12-code.github.io/empire-control-web/`.
3. Integrar tela de login no site com **somente chave publicável** do projeto; jamais colocar `service_role` ou segredos no GitHub.
4. Criar tabelas de posse do usuário para dispositivos, estados e históricos, com **RLS ativada** e políticas por `auth.uid() = owner_id`. Sem políticas que permitam leitura pública desses dados.
5. Criar fluxo de pareamento controlado por servidor: códigos de uso único com expiração curta, hash do código (nunca código em texto puro no banco), autenticação do proprietário, limite de tentativas, expiração, revogação e trilha de eventos.
6. Desenvolver agente Windows separado do motor principal. O agente **inicia HTTPS de saída**; porta `127.0.0.1:8769` **nunca** fica pública. O agente envia apenas indicadores autorizados de leitura e sem credenciais do Goodgame Empire.
7. Conferir separação de dados entre usuários (RLS), sessões expiradas, token inválido, revogação e casos de reconexão antes de habilitar leitura real.

## Fronteiras de confiança

- **GitHub Pages:** código e catálogo públicos, login UI, nenhum segredo, nenhuma sessão BR1.
- **Supabase:** autenticação do site e dados permitidos por usuário; Edge Functions para operações privilegiadas e validação de pareamento.
- **Windows:** credenciais do jogo, conexão BR1, comandos EmpireCore; fora da internet pública.
- **Entre Windows e backend:** conexão HTTPS iniciada localmente, identificador de dispositivo revogável, validação de identidade e de limites.

## Proibições

- Não enviar senha/token/cookie do jogo para site, banco ou logs.
- Não adicionar chave `service_role` no frontend, GitHub ou arquivos públicos.
- Não expor a API HTTP local na internet, nem incluir endereços internos no painel público.
- Não tratar status simulado como conexão real.
- Não habilitar ataques e outras operações mutáveis na Etapa 2.

## Critérios de conclusão

- Dono consegue autenticar-se na interface.
- Usuário sem sessão não consegue acessar dados privados.
- Dois usuários não conseguem ler registros um do outro.
- Nenhum segredo aparece na branch pública.
- Pareamento só será considerado operacional após testes reais de revogação, expiração e reconexão.
