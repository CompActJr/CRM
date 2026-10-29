import argparse
import json
import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests


def make_request(url, method, body, headers, timeout):
    start = time.perf_counter()

    try:
        response = requests.request(
            method=method,
            url=url,
            json=body,
            headers=headers,
            timeout=timeout
        )

        elapsed = time.perf_counter() - start

        return {
            "success": 200 <= response.status_code < 300,
            "status_code": response.status_code,
            "time": elapsed,
            "error": None,
            "response_body": response.text
        }

    except requests.RequestException as error:
        elapsed = time.perf_counter() - start

        return {
            "success": False,
            "status_code": None,
            "time": elapsed,
            "error": str(error),
            "response_body": None
        }

def percentile(values, percentile):
    if not values:
        return 0

    values = sorted(values)

    index = (len(values) - 1) * percentile / 100
    lower = int(index)
    upper = min(lower + 1, len(values) - 1)

    if lower == upper:
        return values[lower]

    return values[lower] + (values[upper] - values[lower]) * (index - lower)

def run_test(url, method, body, headers, requests_count, concurrency, timeout):
    results = []

    start_test = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(
                make_request,
                url,
                method,
                body,
                headers,
                timeout
            )
            for _ in range(requests_count)
        ]

        for future in as_completed(futures):
            result = future.result()
            results.append(result)

    total_time = time.perf_counter() - start_test

    successful = [
        result for result in results
        if result["success"]
    ]
    failed = [
        result for result in results
        if not result["success"]
    ]
    response_times = [
        result["time"]
        for result in results
        if result["time"] is not None
    ]

    # Métricas
    total = len(results)
    success_count = len(successful)
    failure_count = len(failed)

    average = statistics.mean(response_times)
    minimum = min(response_times)
    maximum = max(response_times)

    p50 = percentile(response_times, 50)
    p90 = percentile(response_times, 90)
    p95 = percentile(response_times, 95)
    p99 = percentile(response_times, 99)

    throughput = total / total_time

    # Status HTTP
    status_codes = {}

    for result in results:
        code = result["status_code"]

        if code is not None:
            status_codes[code] = status_codes.get(code, 0) + 1

    return {
        "url": url,
        "method": method,
        "requests": requests_count,
        "concurrency": concurrency,
        "total_time": total_time,
        "successful": success_count,
        "failed": failure_count,
        "success_rate": (success_count / total) * 100,
        "failure_rate": (failure_count / total) * 100,
        "throughput": throughput,
        "response_time": {
            "average": average,
            "min": minimum,
            "max": maximum,
            "p50": p50,
            "p90": p90,
            "p95": p95,
            "p99": p99
        },
        "status_codes": status_codes
    }

def parse_json(value):
    if not value:
        return None

    try:
        return json.loads(value)
    except json.JSONDecodeError as error:
        raise argparse.ArgumentTypeError(
            f"JSON inválido: {error}"
        )

def run_lead_creation_test(base_url, load_profile, usuario_id=1):
    """
    Cria vários leads utilizando carga concorrente e retorna
    as métricas e os IDs dos registros criados.
    """

    url = f"{base_url}/leads"

    requests_count = load_profile["requests"]
    concurrency = load_profile["concurrency"]

    print("\n")
    print("#" * 70)
    print("TESTE: CRIAÇÃO DE LEADS")
    print(f"POST {url}")
    print(f"CARGA: {load_profile['name']}")
    print("#" * 70)

    def create_lead(index):
        body = {
            "nome": f"Lead Teste Carga {index}",
            "email": f"lead.teste.carga.{index}@teste.com",
            "telefone": f"5599999{index:05d}",
            "empresa": f"Empresa Teste {index}",
            "cidade": "Santa Maria",
            "nicho": "Tecnologia",
            "observacoes": "Lead criado automaticamente durante teste de carga",
            "status": "Ativo",
            "dataCadastro": "2026-09-24",
            "usuarioId": usuario_id
        }

        start = time.perf_counter()

        try:
            response = requests.post(
                url,
                json=body,
                headers={
                    "Content-Type": "application/json"
                },
                timeout=30
            )

            elapsed = time.perf_counter() - start

            response_data = None

            try:
                response_data = response.json()
            except ValueError:
                pass

            created_id = None

            if response.status_code == 201 and response_data:
                created_id = response_data.get("id")

            return {
                "success": response.status_code == 201,
                "status_code": response.status_code,
                "time": elapsed,
                "error": None,
                "created_id": created_id
            }

        except requests.RequestException as error:
            elapsed = time.perf_counter() - start

            return {
                "success": False,
                "status_code": None,
                "time": elapsed,
                "error": str(error),
                "created_id": None
            }

    start_test = time.perf_counter()

    results = []

    with ThreadPoolExecutor(max_workers=concurrency) as executor:

        futures = [
            executor.submit(create_lead, i)
            for i in range(1, requests_count + 1)
        ]

        for future in as_completed(futures):
            results.append(future.result())

    total_time = time.perf_counter() - start_test

    successful = [
        result for result in results
        if result["success"]
    ]

    failed = [
        result for result in results
        if not result["success"]
    ]

    response_times = [
        result["time"]
        for result in results
    ]

    status_codes = {}

    for result in results:
        code = result["status_code"]

        if code is not None:
            status_codes[code] = status_codes.get(code, 0) + 1

    total = len(results)

    success_count = len(successful)
    failure_count = len(failed)

    average = statistics.mean(response_times)
    minimum = min(response_times)
    maximum = max(response_times)

    p50 = percentile(response_times, 50)
    p90 = percentile(response_times, 90)
    p95 = percentile(response_times, 95)
    p99 = percentile(response_times, 99)

    throughput = total / total_time

    created_ids = [
        result["created_id"]
        for result in successful
        if result["created_id"] is not None
    ]

    return {
        "url": url,
        "method": "POST",
        "requests": requests_count,
        "concurrency": concurrency,

        "total_time": total_time,

        "successful": success_count,
        "failed": failure_count,

        "success_rate": (success_count / total) * 100,
        "failure_rate": (failure_count / total) * 100,

        "throughput": throughput,

        "response_time": {
            "average": average,
            "min": minimum,
            "max": maximum,
            "p50": p50,
            "p90": p90,
            "p95": p95,
            "p99": p99
        },

        "status_codes": status_codes,

        "created_ids": created_ids
    }

def delete_created_leads(base_url, lead_ids):

    print("\n")
    print("=" * 70)
    print("LIMPEZA DOS DADOS DE TESTE")
    print("=" * 70)

    if not lead_ids:
        print("Nenhum lead para excluir.")
        return {
            "attempted": 0,
            "deleted": 0,
            "failed": 0
        }

    deleted = 0
    failed = 0

    for lead_id in lead_ids:

        url = f"{base_url}/leads/{lead_id}"

        try:
            response = requests.delete(
                url,
                timeout=30
            )

            if response.status_code == 204:
                deleted += 1
            else:
                failed += 1

                print(
                    f"Erro ao excluir lead {lead_id}: "
                    f"HTTP {response.status_code}"
                )

        except requests.RequestException as error:
            failed += 1

            print(
                f"Erro ao excluir lead {lead_id}: "
                f"{error}"
            )

    print(f"Leads criados:       {len(lead_ids)}")
    print(f"Leads excluídos:     {deleted}")
    print(f"Falhas na exclusão:  {failed}")

    return {
        "attempted": len(lead_ids),
        "deleted": deleted,
        "failed": failed
    }

def main():
    parser = argparse.ArgumentParser(
        description="Script simples de teste de carga para APIs REST."
    )

    parser.add_argument(
        "--url",
        required=True,
        help="URL do endpoint"
    )

    parser.add_argument(
        "--method",
        default="GET",
        choices=["GET", "POST", "PUT", "PATCH", "DELETE"],
        help="Método HTTP"
    )

    parser.add_argument(
        "--requests",
        type=int,
        default=100,
        help="Número total de requisições"
    )

    parser.add_argument(
        "--concurrency",
        type=int,
        default=10,
        help="Número de requisições simultâneas"
    )

    parser.add_argument(
        "--body",
        type=parse_json,
        default=None,
        help="Body JSON da requisição"
    )

    parser.add_argument(
        "--headers",
        type=parse_json,
        default=None,
        help="Headers em formato JSON"
    )

    parser.add_argument(
        "--timeout",
        type=float,
        default=30,
        help="Timeout em segundos"
    )

    args = parser.parse_args()

    headers = args.headers or {}

    if args.body is not None:
        headers.setdefault("Content-Type", "application/json")

    print(run_test(
        url=args.url,
        method=args.method,
        body=args.body,
        headers=headers,
        requests_count=args.requests,
        concurrency=args.concurrency,
        timeout=args.timeout
    ))

if __name__ == "__main__":
    main()