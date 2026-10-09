import json
import os
from datetime import datetime


from loadTest import run_test, run_lead_creation_test, delete_created_leads

CONFIG_FILE = "endpoints.json"
RESULTS_DIR = "results"

def load_config():
    with open(CONFIG_FILE, "r", encoding="utf-8") as file:
        return json.load(file)

def run_endpoint_test(endpoint, base_url, load_profile):
    url = base_url + endpoint["path"]

    print("\n")
    print(f"ENDPOINT: {endpoint['name']}")
    print(f"{endpoint['method']} {url}")
    print(f"CARGA: {load_profile['name']}")
    print("\n")

    result = run_test(
        url=url,
        method=endpoint.get("method", "GET"),
        body=endpoint.get("body"),
        headers=endpoint.get("headers", {}),
        requests_count=load_profile["requests"],
        concurrency=load_profile["concurrency"],
        timeout=30
    )

    return result

def generate_report(config):
    base_url = config["base_url"]
    endpoints = config["tests"]
    load_profiles = config["load_profiles"]

    results = []

    start = datetime.now()

    print("\n")
    print("TESTE DE SAÚDE DA API")
    print(f"API: {base_url}")
    print(f"Início: {start}")
    print("\n")

    for endpoint in endpoints:

        # Teste especial de criação de leads
        if endpoint.get("type") == "create_leads":

            all_created_ids = []

            for load_profile in load_profiles:

                result = run_lead_creation_test(
                    base_url=base_url,
                    load_profile=load_profile,
                    usuario_id=endpoint.get("usuarioId", 2)
                )

                result["endpoint_name"] = endpoint["name"]
                result["path"] = endpoint["path"]
                result["load_profile"] = load_profile["name"]

                results.append(result)

                all_created_ids.extend(
                    result["created_ids"]
                )

            # Limpeza
            cleanup = delete_created_leads(
                base_url,
                all_created_ids
            )

            results.append({
                "endpoint": endpoint["path"],
                **cleanup
            })

        # Outros endpoints
        else:

            for load_profile in load_profiles:

                result = run_endpoint_test(
                    endpoint,
                    base_url,
                    load_profile
                )

                result["endpoint_name"] = endpoint["name"]
                result["path"] = endpoint["path"]
                result["load_profile"] = load_profile["name"]

                results.append(result)

    end = datetime.now()

    report = {
        "test": {
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "base_url": base_url,
            "endpoints_tested": len(endpoints),
            "load_profiles": len(load_profiles),
            "total_tests": len(results)
        },

        "results": results
    }

    return report

def save_report(report):
    os.makedirs(RESULTS_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    filename = (
        f"{RESULTS_DIR}/"
        f"api_health_report_{timestamp}.json"
    )

    with open(filename, "w", encoding="utf-8") as file:
        json.dump(
            report,
            file,
            indent=4,
            ensure_ascii=False
        )

    return filename

def print_summary(report):

    print("\n")
    print("RESUMO DO TESTE")
    print("\n")

    print(
        f"{'Endpoint':30}"
        f"{'Carga':12}"
        f"{'Sucesso':12}"
        f"{'Média':12}"
        f"{'P95':12}"
        f"{'Throughput':12}"
    )

    print("\n")

    for result in report["results"]:
        response_time = result["response_time"]

        print(
            f"{result['endpoint_name'][:28]:30}"
            f"{result['load_profile'][:10]:12}"
            f"{result['success_rate']:.1f}%{'':7}"
            f"{response_time['average'] * 1000:.2f} ms{'':3}"
            f"{response_time['p95'] * 1000:.2f} ms{'':3}"
            f"{result['throughput']:.2f} req/s"
        )

def main():

    config = load_config()

    report = generate_report(config)

    filename = save_report(report)

    # print_summary(report)

    print(f"\n Relatório salvo em:")
    print(filename)

if __name__ == "__main__":
    main()