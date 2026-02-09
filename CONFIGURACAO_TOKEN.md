# Configuração de Token - DoceDeRenda Frontend

## 📘 Onde arrumo o token para liberar pro sistema?

Este guia explica como obter e configurar o token de autenticação para o sistema DoceDeRenda.

## 🔑 O que é o Token?

O token é uma chave de autenticação que permite ao frontend se comunicar de forma segura com o backend da aplicação. É como uma senha que identifica e autoriza as requisições.

## 📍 Como Obter o Token

### Opção 1: Através do Administrador do Sistema
1. Entre em contato com o administrador responsável pelo backend DoceDeRenda
2. Solicite um token de acesso para sua instalação
3. O administrador fornecerá uma string de token (exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Opção 2: Através do Backend (Se você tem acesso)
Se você é o administrador e tem acesso ao backend:
1. Acesse o painel administrativo do backend
2. Navegue até a seção de "Tokens" ou "API Keys"
3. Gere um novo token de acesso
4. Copie o token gerado

### Opção 3: Sistema sem Autenticação
Se o seu backend **não exige autenticação**, você **não precisa** configurar nenhum token. Neste caso, simplesmente deixe o campo `VITE_API_TOKEN` vazio no arquivo `.env`.

## ⚙️ Como Configurar o Token

### Passo 1: Criar o Arquivo de Configuração

No diretório raiz do projeto, copie o arquivo de exemplo:

```bash
cp .env.example .env
```

### Passo 2: Editar o Arquivo .env

Abra o arquivo `.env` em um editor de texto e configure:

```env
# URL do backend (altere se necessário)
VITE_API_URL=http://localhost:5150

# Cole seu token aqui
VITE_API_TOKEN=seu-token-aqui
```

**Exemplo com token real:**
```env
VITE_API_URL=http://localhost:5150
VITE_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRvY2VEZVJlbmRhIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Passo 3: Reiniciar o Servidor

Após configurar o token, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## 🔒 Segurança

### ⚠️ IMPORTANTE - Nunca Compartilhe Seu Token!

- **NUNCA** commit o arquivo `.env` no Git (ele já está no `.gitignore`)
- **NUNCA** compartilhe seu token em mensagens, emails ou redes sociais
- **NUNCA** exponha seu token em código público
- Se suspeitar que seu token foi comprometido, gere um novo imediatamente

### ✅ Boas Práticas

1. **Desenvolvimento Local**: Use um token de desenvolvimento/teste
2. **Produção**: Use um token diferente e mais seguro
3. **Equipe**: Cada membro deve ter seu próprio token (se possível)
4. **Rotação**: Troque os tokens periodicamente

## 🧪 Como Testar se o Token Está Funcionando

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abra o navegador em `http://localhost:3000`

3. Abra o Console do Desenvolvedor (F12)

4. Navegue pela aplicação:
   - Acesse "Pedidos", "Clientes" ou "Produtos"
   - Se funcionar sem erros, o token está correto! ✅
   - Se aparecer erros 401/403, o token está incorreto ou expirado ❌

## 🐛 Solução de Problemas

### Erro: "Erro na API" ou Erro 401/403

**Possíveis causas:**
- Token incorreto ou expirado
- Token não configurado no arquivo `.env`
- Backend não está rodando
- URL do backend incorreta

**Soluções:**
1. Verifique se o arquivo `.env` existe e está no diretório raiz
2. Confirme que o token está correto (sem espaços extras)
3. Verifique se o backend está rodando em `http://localhost:5150`
4. Teste se o backend está acessível: `curl http://localhost:5150/api/orders/all`
5. Gere um novo token se necessário

### O arquivo .env não funciona

**Verifique:**
1. O arquivo deve estar na raiz do projeto (mesmo nível que `package.json`)
2. O nome deve ser exatamente `.env` (com o ponto no início)
3. Após criar/editar o `.env`, reinicie o servidor (`npm run dev`)
4. As variáveis devem começar com `VITE_` para serem acessíveis no Vite

### Backend em outro servidor

Se o backend estiver em outro servidor (não localhost):

```env
# Exemplo: Backend em servidor remoto
VITE_API_URL=https://api.meudominio.com.br
VITE_API_TOKEN=seu-token-aqui
```

## 📚 Referências

- [Documentação Vite - Variables de Ambiente](https://vitejs.dev/guide/env-and-mode.html)
- [Documentação do Backend DoceDeRenda](link-para-documentacao-backend)

## 💬 Precisa de Ajuda?

- Abra uma issue no GitHub
- Entre em contato com o suporte técnico
- Consulte o administrador do sistema

---

**Última atualização:** Fevereiro 2026
