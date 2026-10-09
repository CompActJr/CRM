# DELETE /leads/:id

Exclui um lead pelo ID.

## Requisição

Não possui body. Substitua `:id` por um número inteiro positivo.

Exemplo: `DELETE /leads/12`.

## Comportamento

Valida o ID e remove o lead somente quando ele não possui oportunidades vinculadas. Leads com oportunidades não podem ser excluídos para preservar os relacionamentos do funil.

## Retorno de sucesso

**204 No Content**

A resposta não possui body.

## Erros possíveis

- **400**: ID inválido.
- **404**: lead não encontrado.
- **409**: lead possui oportunidades vinculadas.
