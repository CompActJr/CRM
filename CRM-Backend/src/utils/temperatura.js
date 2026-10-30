export const parseTemperaturaRange = (temperatura) => {
    if (temperatura === 'Quente') {
        return { min: 0, max: 4 }
    }

    if (temperatura === 'Morno') {
        return { min: 5, max: 6 }
    }

    if (temperatura === 'Frio') {
        return { min: 7, max: Infinity }
    }

    return null
}
