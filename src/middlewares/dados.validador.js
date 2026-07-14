function dadosValidador(schema){
    return (req, res, next) => {
        try {
            const validated = schema.safeParse(req.body);
            if(!validated.success){
                return res.status(400).json({
                    error: validated.error.issues
                })
            }
            next()

        } catch (error) {
            return res.status(400).json({ error: "Validação falhou" })
        }
    }
}

export default dadosValidador;
