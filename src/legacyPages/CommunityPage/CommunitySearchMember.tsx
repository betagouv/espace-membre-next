'use client'
import React from 'react'

import MemberSelect from '../../components/MemberSelect';
import { CommunityProps } from '.';
import Button from '@codegouvfr/react-dsfr/Button';
import { useRouter } from 'next/navigation';

const css = ".panel { min-height: 400px; }" // to have enough space to display dropdown

/* Pure component */
export const CommunitySearchMember = (props: CommunityProps) => {
    const router = useRouter()
    const [username, setUsername] = React.useState<string|undefined>()

    const [isSaving, setIsSaving] = React.useState<boolean>(false)
    const [errorMessage, setErrorMessage] = React.useState<string | null>()
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>()


    const save = (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        router.push(`/community/${username}`)
    }
    
    return (
    <>
        <div>
            <div>
                <h3>
                    Rechercher un ou une membre
                </h3>
                <form onSubmit={save}>
                    <div>
                        <MemberSelect
                            name="username"
                            placeholder="Sélectionner un membre"
                            onChange={(e: { value: any; }) => {
                                console.log(e)
                                setUsername(e.value)
                            }}
                            members={props.users.map(u => ({
                                value: u.id,
                                label: u.fullname
                            }))}
                            defaultValue={undefined}></MemberSelect>
                    </div>
                    <div className="fr-mt-6v">
                        <Button
                            nativeButtonProps={{
                                type: 'submit'
                            }}
                        >Voir la fiche</Button>
                    </div>
                </form>
                <br />
                <p>
                    Le membre que vous cherchez n'existe pas ? Vous pouvez lui donner le lien du <a href="/onboarding">formulaire de création de fiche</a>.
                </p>
            </div>
        </div>
        <style media="screen">
            {css}
        </style>
    </>)
}
