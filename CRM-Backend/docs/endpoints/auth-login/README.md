# POST /auth/login

Autentica um usuário usando e-mail e senha.

## Requisição

Não exige autenticação prévia. Envie `Content-Type: application/json`.

```json
{
  "email": "admin@empresa.com",
  "senha": "123456"
}
```

`email` e `senha` são obrigatórios. O e-mail é normalizado removendo espaços e convertendo para letras minúsculas.

## Comportamento

O endpoint localiza o usuário pelo e-mail e compara a senha informada com o hash armazenado. A senha nunca é incluída na resposta.

## Retorno de sucesso

**200 OK**

```json
{
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@empresa.com",
    "cargo": "Administrador",
    "perfilAcesso": "Administrador"
  }
}
```

O endpoint não gera token; o controle administrativo existente usa o cabeçalho `x-usuario-id`.

## Erros possíveis

- **400**: e-mail ou senha ausentes.
- **401**: e-mail ou senha inválidos.
