import pg, { Pool, type PoolClient } from 'pg'

export const db = () => {
    const getPool = async (): Promise<PoolClient> => {
        try{
            const pool = new Pool({

            })
            return await pool.connect()
        } catch(err){
            console.log(err)
            throw new Error('Incapaz de conectarse a la BBDD')
        }
        
    }
 
    const api = {
        query: async (sql: string, params: any[] = []): Promise<Array<any>> => {
            const db = await getPool()
            try{
                const result = await db.query(sql, params)
                return result.rows
            } catch(err){
                console.log(err)
                throw new Error('Incapaz de conectarse a la BBDD')
            }
            
        }
    }

    return api
 }