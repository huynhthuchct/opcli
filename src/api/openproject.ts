import type { OpcliConfig } from "../config/store.js";

export interface User {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
}

export interface WorkPackage {
  id: number;
  subject: string;
  lockVersion: number;
  status: string;
  priority: string;
}

export interface Status {
  id: number;
  name: string;
  href: string;
}

export class OpenProjectClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: OpcliConfig) {
    this.baseUrl = config.url.replace(/\/$/, "");
    this.authHeader =
      "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64");
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Authentication failed. Run 'opcli config setup' to update credentials.");
      }
      const body = await res.json().catch(() => ({}));
      const msg = body.message || body._embedded?.errors?.[0]?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return res.json();
  }

  async getMe(): Promise<User> {
    return this.request("/api/v3/users/me");
  }

  async listMyWorkPackages(): Promise<WorkPackage[]> {
    const filters = JSON.stringify([
      { assignee: { operator: "=", values: ["me"] } },
    ]);
    const params = new URLSearchParams({ filters, pageSize: "100" });
    const data = await this.request(`/api/v3/work_packages?${params}`);
    return (data._embedded?.elements || []).map((el: any) => ({
      id: el.id,
      subject: el.subject,
      lockVersion: el.lockVersion,
      status: el._links?.status?.title || "Unknown",
      priority: el._links?.priority?.title || "Unknown",
    }));
  }

  async getWorkPackage(id: number): Promise<WorkPackage> {
    const el = await this.request(`/api/v3/work_packages/${id}`);
    return {
      id: el.id,
      subject: el.subject,
      lockVersion: el.lockVersion,
      status: el._links?.status?.title || "Unknown",
      priority: el._links?.priority?.title || "Unknown",
    };
  }

  async getAvailableStatuses(workPackageId: number): Promise<Status[]> {
    const data = await this.request(
      `/api/v3/work_packages/${workPackageId}/available_statuses`
    );
    return (data._embedded?.elements || []).map((el: any) => ({
      id: el.id,
      name: el.name,
      href: el._links?.self?.href || `/api/v3/statuses/${el.id}`,
    }));
  }

  async updateWorkPackageStatus(
    id: number,
    lockVersion: number,
    statusHref: string
  ): Promise<void> {
    await this.request(`/api/v3/work_packages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        lockVersion,
        _links: { status: { href: statusHref } },
      }),
    });
  }
}
