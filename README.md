# DoceDeRenda - Sistema de Gestão de Pedidos

Sistema de gerenciamento de pedidos para padaria/confeitaria desenvolvido em React.

## 🚀 Configuração Inicial

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Configuração do Ambiente

#### Como configurar o token e URL da API:

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edite o arquivo `.env` e configure:**
   
   - **VITE_API_URL**: URL do seu servidor backend
     - Padrão: `http://localhost:5150`
     - Para produção: altere para o endereço do seu servidor
   
   - **VITE_API_TOKEN**: Token de autenticação (se necessário)
     - Deixe vazio se o backend não exigir autenticação
     - Se o backend exigir, adicione seu token aqui

**Exemplo de configuração `.env`:**

```env
# Desenvolvimento local
VITE_API_URL=http://localhost:5150
VITE_API_TOKEN=

# Produção (exemplo)
# VITE_API_URL=https://api.docederenda.com.br
# VITE_API_TOKEN=seu-token-secreto-aqui
```

### 3. Executar o Projeto

#### Modo Desenvolvimento:
```bash
npm run dev
```
O aplicativo estará disponível em `http://localhost:3000`

#### Build para Produção:
```bash
npm run build
```

#### Preview da Build:
```bash
npm run preview
```

## 📋 Funcionalidades

- **Dashboard**: Visão geral dos pedidos
- **Pedidos**: Gerenciamento completo de pedidos
- **Clientes**: Cadastro e gerenciamento de clientes
- **Produtos**: Cadastro e gerenciamento de produtos e categorias

## 🔐 Autenticação

O sistema suporta autenticação via token Bearer. Para habilitar:

1. Obtenha o token do backend (consulte a documentação do backend)
2. Configure o token no arquivo `.env`
3. O sistema enviará automaticamente o token em todas as requisições

## 🛠️ Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS

## 📝 Estrutura do Projeto

```
DoceDeRendaFront/
├── services/
│   └── api.ts          # Funções de API com suporte a autenticação
├── program.jsx         # Componentes principais da aplicação
├── .env.example        # Template de configuração
└── vite.config.ts      # Configuração do Vite e proxy
```

## ❓ Perguntas Frequentes

### Onde consigo o token para liberar a API?

O token é fornecido pelo backend da aplicação. Entre em contato com o administrador do sistema ou consulte a documentação do backend DoceDeRenda para obter seu token de acesso.

### O token é obrigatório?

Depende da configuração do backend. Se o backend não exigir autenticação, você pode deixar o campo `VITE_API_TOKEN` vazio no arquivo `.env`.

### Como alterar a URL do backend?

Edite o arquivo `.env` e altere o valor de `VITE_API_URL` para o endereço do seu servidor backend.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença especificada no repositório.
