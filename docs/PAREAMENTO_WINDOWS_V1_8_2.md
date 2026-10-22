# Pareamento Windows — Empire Control v1.8.2

Estado: **backend e interface implantados**, **agente Windows pronto para teste**, **pareamento real ainda não testado com o computador do usuário**.

## Como funciona

- GitHub Pages exibe o login Supabase e, em **Configurações**, permite gerar um código de alta entropia de uso único (aprox. 144 bits; expira em 10 minutos).
- `empire-pair-owner` autentica o dono do dispositivo por JWT Supabase validado pelo serviço de Auth, gera códigos e revoga dispositivos.
- `empire-agent` (Edge Function) recebe o código do agente Windows por HTTPS, marca o código consumido atomicamente, vincula um identificador do dispositivo ao proprietário e verifica os sinais de presença subsequentes.
- O segredo aleatório do dispositivo é **gerado e guardado somente no Windows**; o banco armazena o SHA-256 desse segredo, e o dono pode revogar o dispositivo no site.
- O agente comunica-se exclusivamente por HTTPS de saída com o Supabase; o jogo, as credenciais BR1 e a porta local 8769 não são acessados, nem compartilhados.

## Teste no Windows (necessário para validar ponta a ponta)

1. Faça backup da v1.7.15; **não é necessário atualizá-la**.
2. Extraia o pacote do agente Windows fornecido na conversa dentro da pasta principal da v1.7.15. Assim, o agente pode reutilizar o Python da `.venv-br1`, sem alterar o ambiente.
3. Entre em https://jadsonsalles12-code.github.io/empire-control-web/.
4. Vá a **Configurações → Conexão segura com motor local → Gerar código de pareamento**.
5. Dê dois cliques em `PAREAR_COM_SITE.bat` e cole o código fornecido pelo site (não a senha do jogo).
6. Abra `INICIAR_AGENTE.bat` e mantenha a janela aberta.
7. Volte ao site e clique **Atualizar dispositivos**. Esperado: "Agente online — presença confirmada".
8. Experimente clicar em **Revogar** e verifique se o agente perde o acesso. Para repetir o teste é necessário outro código novo.

## Limites

- O sinal online **não comprova** o login BR1 ou disponibilidade do motor EmpireCore; nenhum dado do jogo é lido.
- Ainda não há atualização automática do programa Python; o agente é a primeira instalação local separada.
- O segredo local de autorização do agente está em `%APPDATA%\EmpireControl\dispositivo_pareado.json`; pertence ao usuário Windows, é revogável, mas **ainda não utiliza criptografia DPAPI**. Fortalecer proteção local antes de permitir dados sensíveis.
- As Edge Functions têm `verify_jwt=false` no gateway porque agentes Windows não usam JWT de usuário. A função do proprietário **verifica manualmente** a autenticação JWT via Supabase Auth. O endpoint do agente exige código de uso único de alta entropia ou segredo de dispositivo.
- As tabelas `engine_pairing_requests` e `engine_device_credentials` usam RLS sem políticas para usuários; acesso de serviço apenas.
- O Supabase Auth informou que a proteção contra senhas vazadas está desativada. Ative em **Authentication → Security and Protection**, quando disponível no plano.
- Não usar autenticação do site como autenticação no Goodgame Empire.

## Arquivos do projeto

- `pair-panel.js`: UI de geração de código, listagem e revogação.
- `auth-gate.js`: carrega o painel de pareamento somente após validar a sessão.
- `supabase/functions/empire-pair-owner/index.ts`: operações do proprietário.
- `supabase/functions/empire-agent/index.ts`: pareamento e heartbeat.

A versão local do motor v1.7.15 **não foi alterada**. As atualizações da interface são publicadas pelo GitHub Pages depois de commits na branch main.
