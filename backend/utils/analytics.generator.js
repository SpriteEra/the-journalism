export async function generateLast12MonthsData(model, year = new Date().getFullYear()) {
    const data = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    const isCurrentYear = year.toString() === currentDate.getFullYear().toString();

    if (isCurrentYear) {
        for (let i = 11; i >= 0; i--) {
            const endDate = new Date(
                year,
                currentDate.getMonth() - i,

            );

            const startDate = new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                1
            );

            // Adjust endDate to the last day of the month
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);

            const monthYear = endDate.toLocaleString('default', {
                month: "short",
                year: "numeric"
            });

            const count = await model.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            });

            data.push({ label: monthYear, count });
        }
    }
    else {
        for (let i = 0; i < 12; i++) {
            const startDate = new Date(year, i, 1);
            const endDate = new Date(year, i + 1, 0);

            const monthYear = startDate.toLocaleString('default', {
                month: "short",
                year: "numeric"
            });

            const count = await model.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            });

            data.push({ label: monthYear, count });
        }
    }

    return { data };
}

export async function generateLast30DaysData(model, year = new Date().getFullYear(), month = new Date().getMonth()) {
    const currentDate = new Date();
    const isCurrentMonth = year === currentDate.getFullYear() && month - 1 === currentDate.getMonth();
    // console.log(isCurrentMonth, year, month);
    const daysInMonth = isCurrentMonth ? currentDate.getDate() : new Date(year, month - 1, 0).getDate();
    const data = [];

    const startDay = isCurrentMonth ? currentDate.getDate() - 30 : daysInMonth - daysInMonth + 1;

    for (let day = startDay; day <= daysInMonth; day++) {
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day + 1);

        const dayMonthYear = startDate.toLocaleString('default', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        });

        data.push({ label: dayMonthYear, count });
    }

    return { data };
}
