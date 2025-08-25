import { type Contact, Prisma, PrismaClient } from "@prisma/client";
import { type ContactResponse, type IdentifyInput } from "./models";

export class ContactService {

    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async identify(input: IdentifyInput): Promise<ContactResponse | null> {

        try {
            const email = input.email;
            const phoneNumber = input.phoneNumber;

            if(!email && !phoneNumber) throw new Error("Email and phone number is missing");

            return await this.prisma.$transaction(async (tx) => {
                const seed = await this.findbyEmailorPhone(tx, email, phoneNumber);

                console.log("First seeds : " + seed.length);

                if (seed.length === 0) {
                    const contact = await this.createContact(tx, email, phoneNumber);

                    return {
                        contact: {
                            primaryContactId: contact.id,
                            emails: [email],
                            phoneNumbers: [phoneNumber],
                            secondaryContactIds: [],
                        },
                    };
                }

                let transitivecontacts = await this.findtransitiverelationships(
                    tx,
                    seed
                );

                console.log("Transitive contacts : " + transitivecontacts.length);

                const helpData = await this.findOldestandNeedforNewContact(
                    transitivecontacts,
                    email,
                    phoneNumber
                );

                if (helpData[1] == 0) {
                    const contact = await this.createContact(tx, email, phoneNumber);
                    transitivecontacts.push(contact);
                }

                await this.setPrecedence(tx, transitivecontacts, helpData[0] ?? null);

                console.log("Final contacts : " + transitivecontacts.length);

                return await this.buildResponse(transitivecontacts);
            }, { timeout: 15000 });
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async findbyEmailorPhone(
        tx: Prisma.TransactionClient,
        email: string,
        phoneNumber: string
    ): Promise<Contact[]> {
        const contacts = await tx.contact.findMany({
            where: {
                OR: [{ email: email }, { phoneNumber: phoneNumber }],
            },
            include: {
                linkedTo: true,
            },
        });

        return contacts;
    }

    async createContact(
        tx: Prisma.TransactionClient,
        email: string,
        phoneNumber: string
    ): Promise<Contact> {
        const contact = await tx.contact.create({
            data: {
                email: email,
                phoneNumber: phoneNumber,
                linkPrecedence: "primary",
            },
        });

        console.log("New contact created : " + contact.id);

        return contact;
    }

    async findtransitiverelationships(
        tx: Prisma.TransactionClient,
        contacts: Contact[]
    ): Promise<Contact[]> {
        const queue: number[] = [...contacts.map((c) => c.id)];
        const visited = new Set<number>();

        while (queue.length > 0) {
            const cid = queue.shift()!;

            if (visited.has(cid)) {
                continue;
            }

            visited.add(cid);
            const current = await tx.contact.findUnique({ where: { id: cid } });

            const orConditions: Prisma.ContactWhereInput[] = [
                { id: current!.id },
                { linkedId: current!.id },
            ];

            if (current?.linkedId) {
                orConditions.push({ id: current.linkedId });
            }
            if (current?.email) {
                orConditions.push({ email: current.email });
            }
            if (current?.phoneNumber) {
                orConditions.push({ phoneNumber: current.phoneNumber });
            }

            const neighbours = await tx.contact.findMany({
                where: { OR: orConditions },
            });


            for (const n of neighbours) {
                if (!visited.has(n.id)) {
                    queue.push(n.id);
                }
            }
        }

        return tx.contact.findMany({
            where: { id: { in: Array.from(visited) } },
        });
    }

    async findOldestandNeedforNewContact(
        transitivecontacts: Contact[],
        email: string,
        phoneNumber: string
    ): Promise<number[]> {

        var oldest = transitivecontacts[0];
        var hasDetails = 0;
        var hasEmail = 0;
        var hasPhone = 0;

        for (const tc of transitivecontacts) {

            if (tc?.createdAt! < oldest?.createdAt!) {
                oldest = tc;
            }

            if (tc?.email == email) {
                hasEmail = 1;
            }

            if(tc?.phoneNumber == phoneNumber){
                hasPhone = 1;
            }

            if(hasEmail && hasPhone){
                hasDetails = 1;
            }
        }

        console.log("Oldest : " + oldest?.id + ", hasDetails : " + hasDetails);

        return [oldest?.id!, hasDetails];
    }

    async setPrecedence(
        tx: Prisma.TransactionClient,
        transitivecontacts: Contact[],
        oldestId: number | null
    ): Promise<void> {

        for (const tc of transitivecontacts) {

            if (tc.id != oldestId) {
                await tx.contact.update({
                    where: { id: tc.id },
                    data: { linkPrecedence: "secondary", linkedId: oldestId },
                });
                tc.linkPrecedence = "secondary";
                tc.linkedId = oldestId;
            } else {
                await tx.contact.update({
                    where: { id: tc.id },
                    data: { linkPrecedence: "primary", linkedId: null },
                });
                tc.linkPrecedence = "primary";
                tc.linkedId = null;
            }
        }

    }

    async buildResponse(contacts: Contact[]): Promise<ContactResponse> {

        const primary = contacts.find(c => c.linkPrecedence === "primary");
        if (!primary) throw new Error("No primary contact found");

        return {
            contact: {
                primaryContactId: primary.id,
                emails: Array.from(new Set(contacts.flatMap(c => c.email ? [c.email] : []))),
                phoneNumbers: Array.from(new Set(contacts.flatMap(c => c.phoneNumber ? [c.phoneNumber] : []))),
                secondaryContactIds: contacts
                    .filter(c => c.linkPrecedence === "secondary")
                    .map(c => c.id),
            },
        };
    }

}
