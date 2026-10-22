# Empire Control Web v1.8.0 — GitHub Pages (interface pública)

**Atenção:** esta é uma interface estática de demonstração e configuração de rascunhos. Não faz login no jogo, não tem autenticação própria, não lê a conta, não roda EmpireCore nem dispara ataques. Configurações ficam somente no armazenamento local do navegador; não são sincronizadas entre dispositivos. **Não insira senhas, cookies ou tokens do Goodgame Empire.**

Esta edição pública **não contém as miniaturas oficiais**. Os ícones são ilustrativos. O catálogo possui 252 registros documentais, mas nenhum vínculo garantido com o `wodID`. A edição anterior completa com 234 PNG deve permanecer local, sem redistribuição automática.

## Publicar pelo GitHub Pages — sem instalar ferramentas

1. Entre em https://github.com/new com sua conta GitHub, crie um repositório **público** chamado `empire-control-web`, não marque `Add a README file`, e conclua em **Create repository**. O repositório público expõe os arquivos: nunca envie a pasta original v1.7.15, `.venv`, `dados`, `.env` ou segredos.
2. Na página do repositório vazio, clique **uploading an existing file** (ou **Add file → Upload files**). Arraste **os arquivos de dentro desta pasta** (não a pasta ZIP), incluindo `index.html`, `app.js`, `styles.css` e `catalogo_embedded.js`; finalize em **Commit changes**. Envie também `README.md`; os arquivos devem aparecer na raiz da branch `main`.
3. Abra **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Escolha `main` e `/(root)`, clique **Save**. O GitHub gerará um endereço de publicação e atualizará o site sempre que forem feitos novos commits nessa branch (a propagação pode demorar alguns minutos).

O nome do repositório e a URL final só estarão confirmados depois da criação.

## Atualizações futuras

Toda alteração publicada no GitHub na branch `main` será refletida no site pelo GitHub Pages. **Não é uma sincronização em tempo real do jogo.** O motor Python local terá outro canal de atualização, a desenvolver. As configurações salvas no navegador não ficam disponíveis em outro PC/celular.

## Segurança

- Não disponibilizar a porta local do EmpireCore na internet.
- Não armazenar senha, tokens, cookies nem credenciais do jogo no site ou no GitHub.
- Para a conexão futura, implementar um serviço intermediário autenticado com agente Windows iniciando conexões HTTPS de saída; o GitHub Pages, isoladamente, não oferece backend nem proteção de páginas.
- Ações reais devem permanecer desativadas na interface web até concluir a autenticação/autorização.

## Voltar atrás

A v1.7.15 local continua independente. Para interromper a publicação do site, em Settings → Pages desative GitHub Pages. O repositório pode continuar existindo como backup do código público.

## Etapa 2: autenticação Supabase (v1.8.1)

O site agora exige login com e-mail e senha **do Empire Control**, não do jogo. O motor Python continua exclusivamente no Windows.

**Antes de cadastrar-se**, configure o endereço correto de confirmação de e-mail no Supabase conforme [docs/AUTENTICACAO_SUPABASE.md](docs/AUTENTICACAO_SUPABASE.md).

- Supabase: projeto `Empire Control` em São Paulo, no plano gratuito.
- Código do site: público; o acesso à interface depende de autenticação.
- Dados privados futuros: sempre protegidos por RLS do Supabase.
- `engine_devices` e `engine_read_snapshots`: tabelas prontas, vazias e sem pareamento.
- Não há integração BR1 nem envio de comandos pelo site nesta etapa.
- Rascunhos do navegador são separados por usuário. Configurações antigas de um perfil local não são importadas automaticamente.
