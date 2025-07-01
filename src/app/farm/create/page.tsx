'use client'

import { useFormState } from 'react-dom'
import { createFarm } from './actions'

const thaiProvinces = [
  'Bangkok',
  'Samut Prakan',
  'Nonthaburi',
  'Pathum Thani',
  'Phra Nakhon Si Ayutthaya',
  'Ang Thong',
  'Lopburi',
  'Sing Buri',
  'Chai Nat',
  'Saraburi',
  'Chon Buri',
  'Rayong',
  'Chanthaburi',
  'Trat',
  'Chachoengsao',
  'Prachin Buri',
  'Nakhon Nayok',
  'Sa Kaeo',
  'Nakhon Ratchasima',
  'Buri Ram',
  'Surin',
  'Si Sa Ket',
  'Ubon Ratchathani',
  'Yasothon',
  'Chaiyaphum',
  'Amnat Charoen',
  'Nong Bua Lam Phu',
  'Khon Kaen',
  'Udon Thani',
  'Loei',
  'Nong Khai',
  'Maha Sarakham',
  'Roi Et',
  'Kalasin',
  'Sakon Nakhon',
  'Nakhon Phanom',
  'Mukdahan',
  'Chiang Mai',
  'Lamphun',
  'Lampang',
  'Uttaradit',
  'Phrae',
  'Nan',
  'Phayao',
  'Chiang Rai',
  'Mae Hong Son',
  'Nakhon Sawan',
  'Uthai Thani',
  'Kamphaeng Phet',
  'Tak',
  'Sukhothai',
  'Phitsanulok',
  'Phichit',
  'Phetchabun',
  'Ratchaburi',
  'Kanchanaburi',
  'Suphan Buri',
  'Nakhon Pathom',
  'Samut Sakhon',
  'Samut Songkhram',
  'Phetchaburi',
  'Prachuap Khiri Khan',
  'Nakhon Si Thammarat',
  'Krabi',
  'Phang Nga',
  'Phuket',
  'Surat Thani',
  'Ranong',
  'Chumphon',
  'Songkhla',
  'Satun',
  'Trang',
  'Phatthalung',
  'Pattani',
  'Yala',
  'Narathiwat',
]

const initialState = {
  message: '',
}

export default function CreateFarmPage() {
  const [state, formAction] = useFormState(createFarm, initialState)

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create a New Farm</h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form action={formAction}>
              <div className="form-control">
                <label className="label" htmlFor="name">
                  <span className="label-text">Farm Name</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input input-bordered"
                  placeholder="e.g., Jaothui Farm"
                />
              </div>
              <div className="form-control mt-4">
                <label className="label" htmlFor="province">
                  <span className="label-text">Province</span>
                </label>
                <select
                  id="province"
                  name="province"
                  required
                  className="select select-bordered"
                  defaultValue=""
                >
                  <option disabled value="">
                    Select a province
                  </option>
                  {thaiProvinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary">
                  Create Farm
                </button>
              </div>
              {state?.message && (
                <p className="text-red-500 mt-4">{state.message}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
