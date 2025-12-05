const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAYS_KZ = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жс'];
const DAYS = { nameRu: DAYS_RU, nameKz: DAYS_KZ };

const OFF_RE = /^(выходной|закрыто|off|offday|\-+|—+|нет)$/i;

function normHours(s) {
    if (!s) return null;
    const x = String(s).trim();
    if (OFF_RE.test(x.replace(/\s+/g, ''))) return 'off';
    const m = x.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    return m ? `${m[1]}-${m[2]}` : null;
}

function parse(raw) {
    // возвращает массив по дням недели: ['10:00-17:00'|'off'|null, ...]
    const byDay = Array(7).fill(null);
    if (!raw) return byDay;
    String(raw)
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(part => {
            const m = part.match(/^([ПВСЧ][нртбс])\s*:\s*(.+)$/i); // Пн/Вт/Ср/Чт/Пт/Сб/Вс
            if (!m) return;
            const day = m[1][0].toUpperCase() + m[1][1].toLowerCase();
            const idx = DAYS_RU.indexOf(day);
            if (idx === -1) return;
            byDay[idx] = normHours(m[2]);
        });
    return byDay;
}

function groupConsecutive(hoursArr) {
    const groups = [];
    let s = 0;
    for (let i = 1; i <= hoursArr.length; i++) {
        if (i === hoursArr.length || hoursArr[i] !== hoursArr[s]) {
            groups.push({ s, e: i - 1, h: hoursArr[s] });
            s = i;
        }
    }
    return groups;
}

function rangeLabel(lang, s, e) {
    const L = DAYS[lang] || DAYS_RU;
    return s === e ? L[s] : `${L[s]}–${L[e]}`;
}

function phrase(lang, from, to) {
    return lang === 'nameKz' ? `${from}-ден ${to}-ге дейін` : `с ${from} до ${to}`;
}

export function formatWorkHoursList(raw, lang = 'nameRu') {
    const hours = parse(raw);
    const groups = groupConsecutive(hours);

    return groups.map(g => {
        const label = rangeLabel(lang, g.s, g.e);
        if (g.h === 'off') {
            return lang === 'nameKz' ? `${label} жабық` : `${label} выходной`;
        }
        if (!g.h) return `${label} —`;
        const [from, to] = g.h.split('-');
        return lang === 'nameKz'
            ? `${label} ${phrase('nameKz', from, to)}`
            : `${label} ${phrase('nameRu', from, to)}`;
    });
}

/**
 * Получает рабочие часы для конкретного дня недели
 * @param {string} workHours - строка рабочих часов
 * @param {number} dayOfWeek - день недели (0-6, где 0 = воскресенье в dayjs)
 * @returns {string|null} строка с часами работы или 'off' или null
 */
export function getWorkHoursForDay(workHours, dayOfWeek) {
    const parsedHours = parse(workHours);
    // Конвертируем dayjs день недели (0=воскресенье) в наш формат (0=понедельник)
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return parsedHours[adjustedDay];
}

/**
 * Проверяет, работает ли заведение в указанное время
 * @param {string} workHours - строка рабочих часов
 * @param {number} dayOfWeek - день недели (0-6, где 0 = воскресенье в dayjs)
 * @param {string} time - время в формате "HH:mm"
 * @returns {boolean} true если заведение работает в это время
 */
export function isWorkingAtTime(workHours, dayOfWeek, time) {
    const dayWorkHours = getWorkHoursForDay(workHours, dayOfWeek);

    if (!dayWorkHours || dayWorkHours === 'off') {
        return false;
    }

    const [timeHours, timeMinutes] = time.split(':').map(Number);
    const timeInMinutes = timeHours * 60 + timeMinutes;

    const [openHours, openMinutes] = dayWorkHours.split('-')[0].split(':').map(Number);
    const [closeHours, closeMinutes] = dayWorkHours.split('-')[1].split(':').map(Number);

    const openInMinutes = openHours * 60 + openMinutes;
    const closeInMinutes = closeHours * 60 + closeMinutes;

    // Если время закрытия меньше времени открытия, значит работаем через полночь
    if (closeInMinutes < openInMinutes) {
        // Работаем с открытия до конца дня И с начала дня до закрытия (включительно)
        return timeInMinutes >= openInMinutes || timeInMinutes <= closeInMinutes;
    } else {
        // Обычная работа в пределах одного дня
        return timeInMinutes >= openInMinutes && timeInMinutes < closeInMinutes;
    }
}

/**
 * Создает функцию для disabledHours на основе рабочих часов
 * @param {string} workHours - строка рабочих часов
 * @param {number} dayOfWeek - день недели (0-6, где 0 = воскресенье в dayjs)
 * @param {string} lastEndTime - время окончания предыдущего события
 * @returns {Function} функция для disabledHours
 */
export function createDisabledHours(workHours, dayOfWeek, lastEndTime) {
    return () => {
        const disabledHours = [];
        const dayWorkHours = getWorkHoursForDay(workHours, dayOfWeek);

        // Если заведение не работает в этот день
        if (!dayWorkHours || dayWorkHours === 'off') {
            return Array.from({ length: 24 }, (_, i) => i);
        }

        const [openHours] = dayWorkHours.split('-')[0].split(':').map(Number);
        const [closeHours] = dayWorkHours.split('-')[1].split(':').map(Number);

        // Если время закрытия меньше времени открытия, значит работаем через полночь
        if (closeHours < openHours) {
            // Отключаем часы между закрытием и открытием (например, с 02:00 до 10:00)
            for (let i = closeHours; i < openHours; i++) {
                disabledHours.push(i);
            }
        } else {
            // Обычная работа в пределах одного дня
            // Отключаем часы до открытия
            for (let i = 0; i < openHours; i++) {
                disabledHours.push(i);
            }

            // Отключаем часы после закрытия
            for (let i = closeHours; i < 24; i++) {
                disabledHours.push(i);
            }
        }

        // Если есть предыдущее событие, отключаем часы до его окончания
        if (lastEndTime) {
            const [lastEndHour] = lastEndTime.split(':').map(Number);
            for (let i = 0; i <= lastEndHour; i++) {
                if (!disabledHours.includes(i)) {
                    disabledHours.push(i);
                }
            }
        }

        return disabledHours;
    };
}

/**
 * Создает функцию для disabledMinutes на основе рабочих часов
 * @param {string} workHours - строка рабочих часов
 * @param {number} dayOfWeek - день недели (0-6, где 0 = воскресенье в dayjs)
 * @param {string} lastEndTime - время окончания предыдущего события
 * @returns {Function} функция для disabledMinutes
 */
export function createDisabledMinutes(workHours, dayOfWeek, lastEndTime) {
    return (selectedHour) => {
        const disabledMinutes = [];
        const dayWorkHours = getWorkHoursForDay(workHours, dayOfWeek);

        // Если заведение не работает в этот день
        if (!dayWorkHours || dayWorkHours === 'off') {
            return Array.from({ length: 60 }, (_, i) => i);
        }

        const [openHours, openMinutes] = dayWorkHours.split('-')[0].split(':').map(Number);
        const [closeHours, closeMinutes] = dayWorkHours.split('-')[1].split(':').map(Number);

        // Если время закрытия меньше времени открытия, значит работаем через полночь
        if (closeHours < openHours) {
            // Если выбран час между закрытием и открытием, отключаем все минуты
            if (selectedHour >= closeHours && selectedHour < openHours) {
                return Array.from({ length: 60 }, (_, i) => i);
            }

            // Если выбран час открытия, отключаем минуты до открытия
            if (selectedHour === openHours) {
                for (let i = 0; i < openMinutes; i++) {
                    disabledMinutes.push(i);
                }
            }

            // Если выбран час закрытия, отключаем минуты после закрытия
            if (selectedHour === closeHours) {
                for (let i = closeMinutes; i < 60; i++) {
                    disabledMinutes.push(i);
                }
            }
        } else {
            // Обычная работа в пределах одного дня
            // Если выбран час открытия, отключаем минуты до открытия
            if (selectedHour === openHours) {
                for (let i = 0; i < openMinutes; i++) {
                    disabledMinutes.push(i);
                }
            }

            // Если выбран час закрытия, отключаем минуты после закрытия
            if (selectedHour === closeHours) {
                for (let i = closeMinutes; i < 60; i++) {
                    disabledMinutes.push(i);
                }
            }
        }

        // Если есть предыдущее событие и выбран час его окончания
        if (lastEndTime) {
            const [lastEndHour, lastEndMinute] = lastEndTime.split(':').map(Number);
            if (selectedHour === lastEndHour) {
                for (let i = 0; i <= lastEndMinute; i++) {
                    if (!disabledMinutes.includes(i)) {
                        disabledMinutes.push(i);
                    }
                }
            }
        }

        return disabledMinutes;
    };
}

/**
 * Проверяет, превышает ли интервал между событиями указанное время
 * @param {string} lastEventEndTime - время окончания предыдущего события в формате "HH:mm"
 * @param {string} newEventStartTime - время начала нового события в формате "HH:mm"
 * @param {number} maxGapHours - максимальный интервал в часах (по умолчанию 2)
 * @returns {boolean} true если интервал превышает максимальный
 */
export function exceedsTimeGap(lastEventEndTime, newEventStartTime, maxGapHours = 2) {
    if (!lastEventEndTime || !newEventStartTime) return false;

    const [lastEndHour, lastEndMinute] = lastEventEndTime.split(':').map(Number);
    const [newStartHour, newStartMinute] = newEventStartTime.split(':').map(Number);

    const lastEndInMinutes = lastEndHour * 60 + lastEndMinute;
    const newStartInMinutes = newStartHour * 60 + newStartMinute;

    // Вычисляем интервал в минутах
    let gapInMinutes;
    if (newStartInMinutes >= lastEndInMinutes) {
        // Новое событие в тот же день или позже
        gapInMinutes = newStartInMinutes - lastEndInMinutes;
    } else {
        // Новое событие на следующий день
        gapInMinutes = (24 * 60) - lastEndInMinutes + newStartInMinutes;
    }

    const maxGapInMinutes = maxGapHours * 60;
    return gapInMinutes > maxGapInMinutes;
}
