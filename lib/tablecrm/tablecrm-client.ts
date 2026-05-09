const TABLECRM_API_URL = "https://app.tablecrm.com/api/v1";

type SearchParams = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, token: string, searchParams?: SearchParams) {
  const url = new URL(`${TABLECRM_API_URL}${path}`);

  url.searchParams.set("token", token);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

export async function tablecrmGet<T>(
  path: string,
  token: string,
  searchParams?: SearchParams,
): Promise<T> {
  const response = await fetch(buildUrl(path, token, searchParams), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`TableCRM GET ${path} failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function tablecrmPost<TResponse, TBody>(
  path: string,
  token: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(buildUrl(path, token), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`TableCRM POST ${path} failed: ${response.status} ${text}`);
  }

  return response.json();
}