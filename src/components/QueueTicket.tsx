'use client'

import React from 'react'

type QueueTicketProps = {
    storeInfo: {
        name: string
    }
    queueNumber: string
    notes?: string | null
    customerName?: string | null
}

export function QueueTicket({ storeInfo, queueNumber }: QueueTicketProps) {
    return (
        <div id="queue-ticket-print" className="hidden print:block w-[80mm] p-4 text-black font-mono text-center bg-white">
            <div className="pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest">{storeInfo.name}</p>
            </div>

            <div className="py-8 border-t border-b border-dashed border-black">
                <p className="text-[10px] uppercase tracking-widest mb-1">Nomor Antrean</p>
                <h1 className="text-8xl font-black text-black leading-none">{queueNumber}</h1>
            </div>

            <div className="pt-2">
                <p className="text-[9px] uppercase">{new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <p className="text-[9px] mt-1 italic">Silakan tunggu panggilan kami</p>
            </div>
        </div>
    )
}
