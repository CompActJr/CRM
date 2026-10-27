// O banco remoto (Supabase) responde com latência alta; as transações interativas
// que encadeiam várias queries precisam de mais folga que o padrão de 5s.
export const TransactionOptions = {
  maxWait: 10000,
  timeout: 20000,
}
