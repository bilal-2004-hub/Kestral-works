const MAX_LIMIT = 100;

function getPagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

const buildMeta = ({ page, limit, total }) => ({
  page, limit, total, pages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { getPagination, buildMeta };
