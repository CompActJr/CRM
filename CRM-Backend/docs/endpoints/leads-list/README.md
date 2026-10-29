# GET /leads

Lista os leads cadastrados, ordenados pela data de cadastro mais recente.

## Requisição

Não possui body. Os filtros são opcionais e enviados na query string:

| Parâmetro | Descrição |
|-----------|-----------|
| `usuarioId` | Filtra pelo responsável. |
| `nome` | Filtra pelo nome exato. |
| `empresa` | Filtra pela empresa exata. |
| `cidade` | Filtra pela cidade exata. |
| `nicho` | Filtra pelo nicho exato. |
| `status` | Aceita `Ativo` ou `Inativo`. |
| `dataInicio` | Data inicial no formato `YYYY-MM-DD`. |
| `dataFim` | Data final no formato `YYYY-MM-DD`. |

Exemplo: `GET /leads?status=Ativo&cidade=São Paulo`.

## Comportamento

Consulta os leads com os filtros informados. Além dos dados básicos, cada item pode conter o resumo de tarefas pendentes associadas ao lead.

## Retorno de sucesso

**200 OK**

```json
[
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
    "responsavel": "Administrador"
  }
]
```

O array pode ser vazio quando nenhum lead atender aos filtros.

## Erros possíveis

- **400**: data inválida, intervalo invertido ou filtro de usuário inválido.
