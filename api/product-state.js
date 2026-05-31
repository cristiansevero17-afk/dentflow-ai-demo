const { getProductState, hasDatabaseConfig, saveProductState } = require("./_product-store");

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return await new Promise((resolve) => {
    let raw = "";
    req.on?.("data", (chunk) => {
      raw += chunk;
    });
    req.on?.("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        resolve({});
      }
    });
    req.on?.("error", () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const result = await getProductState();
      res.status(200).json({
        ok: true,
        configured: result.configured,
        state: result.state,
        updatedAt: result.updatedAt,
        needsSeed: result.configured && !result.state,
      });
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!hasDatabaseConfig()) {
        res.status(200).json({ ok: false, configured: false, error: "Database non configurato." });
        return;
      }

      if (!body?.state || typeof body.state !== "object") {
        res.status(400).json({ ok: false, configured: true, error: "State mancante." });
        return;
      }

      const result = await saveProductState(body.state);
      res.status(200).json({ ok: true, configured: true, updatedAt: result.updatedAt });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    res.status(500).json({ ok: false, configured: hasDatabaseConfig(), error: error.message || "Database non disponibile." });
  }
};
