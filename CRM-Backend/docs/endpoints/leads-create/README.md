# POST /leads

Cria um novo lead.

## Requisição

Envie `Content-Type: application/json` com os campos abaixo:

```json
{
  "nome": "Carlos Mendes",
  "email": "carlos@technova.com",
  "telefone": "11999999999",
  "empresa": "TechNova Ltda",
  "cidade": "São Paulo",
  "nicho": "Tecnologia",
  "observacoes": "Contato feito na feira de negócios",
  "status": "Ativo",
  "dataCadastro": "2026-09-28",
  "usuarioId": 1
}
```

`nome`, `dataCadastro` e `usuarioId` são obrigatórios. `dataCadastro` deve estar em `YYYY-MM-DD`. `status` aceita `Ativo` ou `Inativo`; qualquer outro valor resulta em `Ativo`. Os demais campos são opcionais e ficam como `null` quando não enviados.

## Comportamento

Valida os dados, confirma que o usuário responsável existe, grava o lead e retorna o registro já formatado.

## Retorno de sucesso

**201 Created**

```json
{
  "id": 12,
  "nome": "Carlos Mendes",
  "email": "carlos@technova.com",
  "telefone": "11999999999",
  "empresa": "TechNova Ltda",
  "cidade": "São Paulo",
  "nicho": "Tecnologia",
  "observacoes": "Contato feito na feira de negócios",
  "status": "Ativo",
  "dataCadastro": "28/09/2026",
  "usuarioId": 1,
  "responsavel": "Administrador"
}
```

## Erros possíveis

- **400**: nome, data, ID do responsável ou formato da data inválido; ou usuário responsável inexistente.
