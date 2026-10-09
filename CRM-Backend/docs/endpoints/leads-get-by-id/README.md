# GET /leads/:id

Busca um lead específico pelo ID.

## Requisição

Não possui body. Substitua `:id` por um número inteiro positivo.

Exemplo: `GET /leads/12`.

## Comportamento

Valida o ID, busca o lead e inclui as oportunidades vinculadas, com seus responsáveis, empresas e etapas do funil.

## Retorno de sucesso

**200 OK**

```json
{
  "id": 12,
  "nome": "Carlos Mendes",
  "email": "carlos@technova.com",
  "telefone": null,
  "empresa": "TechNova Ltda",
  "cidade": "São Paulo",
  "nicho": "Tecnologia",
  "observacoes": null,
  "status": "Ativo",
  "dataCadastro": "28/09/2026",
  "usuarioId": 1,
  "responsavel": "Administrador",
  "oportunidades": []
}
```

Cada oportunidade segue o formato retornado pelo mapper de oportunidades e aparece dentro de `oportunidades`.

## Erros possíveis

- **400**: ID inválido.
- **404**: lead não encontrado.
