import { NameTableConfig } from '@/../electronsrc/createTables';
import { ConfigKeys } from '@/toolkit/consts';

export type ContractConf = {
  address: string;
  type: string;
};

export async function queryContractConf(): Promise<{ err: Error | null; cc: ContractConf | null }> {
  let getAllResult = await SqliteHelper.GetAll(
    'select * from `' +
      NameTableConfig +
      "` where conf_key in('" +
      ConfigKeys.NFTContractAddress +
      "','" +
      ConfigKeys.NFTContractType +
      "')",
  );
  if (getAllResult == null) {
    return { err: new Error('db not connect'), cc: null };
  }
  if (getAllResult.err) {
    //console.log(`getAllResult error ${getAllResult.err.message}`);
    return { err: new Error(`getAllResult error ${getAllResult.err.message}`), cc: null };
  }

  const newConf: ContractConf = {
    address: '',
    type: '',
  };
  for (const item of getAllResult.result) {
    if (item['conf_key'] == ConfigKeys.NFTContractAddress) {
      newConf.address = item['conf_value'];
    } else if (item['conf_key'] == ConfigKeys.NFTContractType) {
      newConf.type = item['conf_value'];
    }
  }

  return { err: null, cc: newConf };
}
