# Empire Control v1.8.1 — Login do site (Supabase Auth)

## Implementado
- Tela de entrada, cadastro por e-mail e senha, recuperação de senha e saída.
- O site **não carrega o painel antes de `auth.getUser()` validar a sessão**.
- Cada usuário tem chave própria para rascunhos do navegador (`localStorage`), por ID da conta Supabase.
- Supabase URL e **chave publicável** no frontend; nenhuma chave secreta de serviço.
- Ainda não existe pareamento BR1 nem envio de ataques pelo site.
- Os arquivos HTML/JS/CSS e o catálogo estático **continuam públicos no GitHub Pages**. A tela de login não protege código distribuído publicamente; somente dados backend com RLS.

## Configuração obrigatória no Supabase (pela interface web)
Acesse: https://supabase.com/dashboard/project/iklkgqkbuvnwrkiqkxqu/auth/url-configuration

Defina **Site URL** para:
```
https://jadsonsalles12-code.github.io/empire-control-web/
```
Inclua em **Redirect URLs** exatamente o mesmo endereço (com barra final).

Em **Authentication → Providers → Email**, confira que autenticação por e-mail esteja habilitada e mantenha a confirmação de e-mail. O envio de mensagens pode depender dos limites do SMTP padrão do Supabase; em especial, destinatários não autorizados na organização podem precisar de um provedor SMTP próprio.

Crie uma conta do **site** com e-mail e senha exclusivos. Não use a senha do Goodgame Empire. Depois da primeira conta, se quiser impedir novos cadastros, desabilite `Allow new users to sign up` no painel Supabase Auth.

## Teste
1. Abra https://jadsonsalles12-code.github.io/empire-control-web/ em janela anônima.
2. Verifique que o painel não aparece sem autenticação.
3. Clique em **Criar conta**, confirme o e-mail e entre.
4. Confira os 23 módulos e o catálogo.
5. Clique em **Sair** e confirme que o painel desaparece.
6. Teste **Esqueci a senha** após configurar as Redirect URLs.

## Segurança / limites
- `auth-gate.js` importa a versão **fixa** `@supabase/supabase-js@2.118.0` por ESM do jsDelivr. Em produção avançada, preferir build versionado, lockfile e hospedagem do bundle no próprio repositório.
- O navegador gerencia tokens de sessão com Supabase Auth; é necessário usar HTTPS e evitar extensões maliciosas.
- Credenciais do jogo, senha da conta BR1, token EmpireCore e secrets Supabase nunca entram nesse frontend.
- O Supabase já possui `engine_devices` e `engine_read_snapshots` com RLS e SELECT para dono, mas **não há dados nem serviços de pareamento implementados**.
- Cada dispositivo terá autorização via backend em uma etapa posterior, nunca via chave secreta no GitHub.
- Para reverter, restaure o commit anterior pelo histórico GitHub. O banco de dados não foi alterado nesta etapa.
