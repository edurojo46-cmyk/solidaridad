// =========== BUSCADOR GLOBAL ===========
window.db.searchUsersGlobal = async function(query) {
    if (!sbClient) return [];
    try {
        var { data, error } = await sbClient
            .from('perfiles')
            .select('id, nombre, color, avatar_url')
            .ilike('nombre', '%' + query + '%')
            .limit(10);
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Global search error:", e);
        return [];
    }
};
