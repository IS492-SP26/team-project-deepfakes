## Paper 1

#### Full Citation:

Alanazi, S., & Asif, S. (2024). Exploring deepfake technology: Creation, consequences and countermeasures. Human-Intelligent Systems Integration, 6, 49–60. https://doi.org/10.1007/s42454-024-00054-8

#### Link:

https://doi.org/10.1007/s42454-024-00054-8

#### Summary:

This paper reviews deepfake technology overall and addresses how to detect it, as well as its social impact and legislation. It clearly explains the production mechanisms and tools of deepfakes, and emphasizes that deepfake content can be easily created by non-experts as well using these tools. Alanazi and Asif (2024) introduce multiple technologies for detecting deepfakes in images and videos but mention that detection technologies are not perfect, while deepfake tools keep improving. They also explore lots of negative social impacts of deepfakes, such as blackmail and the decline of public trust in media.

#### Insights:
- Deepfake technology is becoming more and more accessible, so that non-expert can also make deepfake content easily. This implies that the number of deepfake-related incidents would be more and more increased.
- Deepfake detection technologies are not perfect, because deepfake technology itself keeps improving rapidly.
- Existing legal frameworks and policies are not enough in addressing new types of deepfake-related harm because they are mostly not proactive and designed to address existing cases. 

#### Limitations/risks:
- While the paper mentions several negative social impacts of deepfakes, it doesn't examine and analyze them deeply because it mainly focuses on technical aspect. Therefore, this paper is not enough to gain deeper insights into deepfake-related harms.
- This paper heavily focuses on detection technology as a solution for deepfake-related issues. However, detection is fundamentally not a proactive, but a reactive approach which can only be used after deepfake content has already been spread. It would be better if they suggest different solutions as well.

#### Idea:
Based on the deepfake lifecycle (Deepfake creation -> distribution -> detection -> mitigation) suggested by Alanazi & Asif (2024), we could create lifecycle-based model and DB which identify incident information in terms of these four cycles and record incidents based on lifecycle-based metadata. For example, in the creation stage, we could identify the model or tools used, and in the distribution stage, we could record the platform where the content was first uploaded and distributed.


## Paper 2

#### Full Citation:

Abercrombie, G., Benbouzid, D., Giudici, P., Golpayegani, D., Hernandez, J., Noro, P., Pandit, H. J., Paraschou, E., Pownall, C., Prajapati, J., Sayre, M. A., Sengupta, U., Suriyawongkul, A., Thelot, R., Vei, S., & Waltersdorfer, L. (2024). *A collaborative, human-centred taxonomy of AI, algorithmic, and automation harms*. arXiv. https://arxiv.org/abs/2407.01294

#### Link:

https://arxiv.org/abs/2407.01294

#### Summary:

As AI has become widely used in various fields and methods nowadays, lots of side effects have occurred as much as its advantages. However, the existing taxonomies about AI risks are too centered around professional and governmental perspectives and are difficult for the public to understand. Therefore, Abercrombie et al. (2024) suggested a new AI harm taxonomy which is clearer, more understandable, and flexible by analyzing an actual AI harm database, collecting feedback from experts, and conducting annotation testing multiple times. As a result, they finalized AI harms into nine major categories (Autonomy, Physical, Psychological, Reputational, Financial & Business, Human Rights & Civil Liberties, Societal & Cultural, Political & Economic, and Environmental), with 69 sub-categories under these main categories. With the new taxonomy, they aim to provide valuable reference for AI Governance, risk management, policy making, and so on. 

#### Insights:
- One incident can cause multiple harms across different categories. For example, a deepfake incident may produce various harms that fall into multiple taxonomy categories, such as psychological, reputational, and autonomy harms.
- It is important to distinguish potential harm and actual harm, because they could be used in a different way. For example, potential harm data can be used for threat modeling, and actual harm data can be used as an evidence or for pattern analysis.
- Clear and structured harm taxonomy can empower civil society organizations, journalists, and citizens by enabling clearer identification and reporting of AI-related harms. This implies the importance of building a structured taxonomy to reduce AI harm. 

#### Limitations/risks:
- The taxonomy in this paper is still in an early stage of development and not yet tested outside of the working group, it might be not very reliable or useful for real-world cases.
- Classification could cause oversimplification and normalization issues, minimizing the severity of the risk or importance of the event

#### Idea:

I believe our group could use this taxonomy when identifying the types of harm in deepfake incidents and implement a multi-label harm tagging system, since what we plan to build is a deepfake incident database, and Abercrombie et al. (2024) suggest that one incident can cause multiple harms.

