# 🔧 Configuração do .env.local

Para conectar com o Supabase, você precisa criar o arquivo `.env.local` na raiz do projeto.

## Passos:

1. **Crie o arquivo** `.env.local` na pasta `c:\Users\Thales\caaqui-projectops\`

2. **Cole o conteúdo** abaixo no arquivo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ohanjvrxywgreokkeckd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
```

3. **Substitua** `SUA_CHAVE_ANON_AQUI` pela sua chave anon do Supabase

## Como encontrar sua chave anon:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em **Settings** → **API**
3. Copie a chave **anon public**

## Depois de configurar:

1. **Reinicie** o servidor (`Ctrl+C` e `npm run dev`)
2. **Recarregue** a página
3. **Verifique** o console - deve mostrar configuração correta

---

**⚠️ IMPORTANTE:** O arquivo `.env.local` não deve ser commitado no Git (já está no .gitignore)
