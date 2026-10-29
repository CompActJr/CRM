# PUT /leads/:id

Atualiza um lead existente.

## Requisição

Substitua `:id` por um número inteiro positivo e envie `Content-Type: application/json`. O body segue o mesmo contrato de criação:

```json
{
  "nome": "Carlos Mendes Atualizado",
  "email": "carlos.novo@technova.com",
  "telefone": "11988887777",
  "empresa": "TechNova Ltda",
  "cidade": "São Paulo",
  "nicho": "Tecnologia",
  "observacoes": "Novo contato realizado",
  "status": "Ativo",
  "dataCadastro": "2026-09-28",
  "usuarioId": 1
}
```

`nome`, `dataCadastro` e `usuarioId` continuam obrigatórios no body, mesmo na atualização.

## Comportamento

Valida o ID e o body, confirma que o lead e o responsável existem, substitui os dados persistidos e retorna o lead atualizado.

## Retorno de sucesso

**200 OK**

Retorna o objeto do lead atualizado no mesmo formato de `POST /leads`, incluindo `responsavel` e `dataCadastro` como `DD/MM/YYYY`.

## Erros possíveis

- **400**: ID ou dados inválidos.
- **404**: lead não encontrado.
