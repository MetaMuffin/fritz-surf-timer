import fetch from "node-fetch"

export type Moment = [number, number, number]
export interface Period {
    from: Moment,
    to: Moment
}
export interface SurfData {
    timer: Period[]
}


export function parse_data_timer(s: string): Period[] | undefined {
    var stimer = s.substr("data.timer = [[".length, s.length - "]];".length - "data.timer = [[".length)
    var stimer_sdays = stimer.split("],[")
    var timer_sdays = stimer_sdays.map(sday => {
        return sday.substr("new Period(".length, sday.length - ")".length - "new Period(".length).split("),new Period")
    })
    var timer_days: Period[][] = timer_sdays.map(sday => {
        return sday.map(speriod => {
            const regex = /new Moment\((\d+),(\d+),(\d+)\), new Moment\((\d+),(\d+),(\d+)\),'.+'/i
            var match = speriod.match(regex)
            if (!match) throw new Error("invalid format!");
            var period: Period = {
                from: [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])],
                to: [parseInt(match[4]), parseInt(match[5]), parseInt(match[6])]
            }
            return period
        })
    })
    //@ts-ignore
    var periods = [].concat(...timer_days)
    return periods
}

export function parse_data(s: string) {
    let sdata = s.substr("var data = ".length, s.length - ";".length - "var data = ".length)
    return JSON.parse(sdata)
}

export async function get_times() {
    var res = await fetch("http://192.168.178.1/surf.lua")
    if (!res.ok) return undefined
    var rcontent = await res.text()
    var data!: SurfData
    for (const line of rcontent.split("\n")) {
        if (line.startsWith("var data = ")) data = parse_data(line)
        if (line.startsWith("data.timer =")) data.timer = parse_data_timer(line) || []
    }
    return data
}

export function moment_sub_mins(mi: Moment, s: number): Moment {
    var m: Moment = [mi[0], mi[1], mi[2]];
    m[2] -= s
    while (m[2] < 0) m[1] -= 1, m[2] += 60
    while (m[1] < 0) m[0] -= 1, m[1] += 24
    while (m[0] < 0) m[0] += 7
    return m
}

export function moment_to_crontab_time(m: Moment): string {
    return `${m[2]} ${m[1]} * * ${m[0]}`
}

async function main() {

    const data = await get_times()
    if (!data) {
        console.error("Could not retrieve information.");
        process.exit(1)
    }

    var option = process.argv.find(a => a.startsWith("-"))
    if (!option) option = "-h"

    const options: { [key: string]: () => void } = {
        "-h": () => {
            console.log("Periods of granted internet access:");
            const pad_num = (n: number) => (n + "").padStart(2, "0")
            const format_moment = (m: Moment) => `${["mon", "tue", "wed", "thu", "fri", "sat", "sun"][m[0]]} ${pad_num(m[1])}:${pad_num(m[2])}`
            console.log(data.timer.map(p => `${format_moment(p.from)} - ${format_moment(p.to)}`).join("\n"))
        },
        "-c": () => {
            for (const p of data.timer) {
                var turned_on = p.from
                var turned_off = p.to
                var about_to_turn_off = moment_sub_mins(p.to, 5)
                var uid = process.getuid();
                console.log(moment_to_crontab_time(turned_off) + ` DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/${uid}/bus' /bin/notify-send 'Internet access should be disabled now.'`)
                console.log(moment_to_crontab_time(about_to_turn_off) + ` DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/${uid}/bus' /bin/notify-send 'Internet access will be disabled in 5m.'`)
                console.log(moment_to_crontab_time(turned_on) + ` DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/${uid}/bus' /bin/notify-send Internet 'access should be enabled now.'`)
            }
        },
        "-j": () => {
            console.log(JSON.stringify(data))
        }
    }

    if (!options[option]) return console.error("unknown option")
    options[option]()
}

main()
