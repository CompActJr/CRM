# GET /usuarios

Lista os usuários cadastrados.

## Requisição

Não possui body. Exige o cabeçalho `x-usuario-id` com o ID de um usuário cujo perfil seja `Administrador`.

```http
x-usuario-id: 1
```

## Comportamento

Valida o usuário informado no cabeçalho, permite o acesso somente a administradores e retorna todos os usuários em ordem alfabética pelo nome. As senhas não são expostas.

## Retorno de sucesso

**200 OK**

```json
[
  {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@empresa.com",
    "cargo": "Administrador",
    "perfilAcesso": "Administrador",
    "perfil": "Administrador"
  }
]
```

O array pode ser vazio quando não houver usuários cadastrados.

## Erros possíveis

- **403**: cabeçalho ausente, ID inválido, usuário inexistente ou usuário sem perfil de administrador.
